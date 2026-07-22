#!/usr/bin/env bash

set -euo pipefail

stripe() {
	mise exec -- stripe "$@"
}

stripe_id() {
	node -e 'let input = ""; process.stdin.on("data", (chunk) => (input += chunk)).on("end", () => process.stdout.write(JSON.parse(input).id))'
}

intro_unlock_config() {
	node_modules/.bin/tsx -e "import('./src/lib/payments/intro-unlock.config.ts').then((m) => console.log(m.$1))"
}

case "${1:-}" in
	check)
		stripe version
		;;

	create)
		stripe sandbox create
		;;

	provision)
		product_json="$(stripe products create \
			--confirm \
			--name 'Intro unlock' \
			--description 'One-time access to an accepted introduction')"
		product_id="$(printf '%s' "$product_json" | stripe_id)"
		price_json="$(stripe prices create \
			--confirm \
			--product "$product_id" \
			--unit-amount "$(intro_unlock_config INTRO_UNLOCK_PRICE_CENTS)" \
			--currency "$(intro_unlock_config INTRO_UNLOCK_CURRENCY)")"
		price_id="$(printf '%s' "$price_json" | stripe_id)"

		printf 'Created sandbox product %s and price %s.\n' "$product_id" "$price_id"
		printf 'Set STRIPE_INTRO_UNLOCK_PRICE_ID=%s in .env.development.local.\n' "$price_id"
		;;

	listen)
		stripe listen \
			--events checkout.session.completed,checkout.session.async_payment_succeeded \
			--forward-to "http://localhost:${APP_PORT:-3000}/api/stripe-webhook"
		;;

	*)
		printf 'Usage: %s {check|create|provision|listen}\n' "$0" >&2
		exit 2
		;;
esac
