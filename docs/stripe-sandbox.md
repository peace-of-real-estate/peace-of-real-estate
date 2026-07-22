# Local Stripe Sandbox

This workflow uses Stripe test mode, the Stripe CLI installed by `mise`, and the
app's existing signed webhook route. It does not use production data.

## One-time setup

Install and verify the CLI:

```sh
mise install
pnpm stripe:sandbox:check
```

Authenticate interactively in the Stripe CLI. Run this yourself; it opens a
browser and may print account information:

```sh
mise exec -- stripe login
```

If you need a new claimable Stripe sandbox instead, run this yourself. It may
open a browser or require you to claim the sandbox:

```sh
pnpm stripe:sandbox:create
```

Create the one-time USD 20 intro-unlock product and price:

```sh
pnpm stripe:sandbox:provision
```

The command prints only Stripe resource IDs. Add the printed price ID to the
gitignored `.env.development.local` file as `STRIPE_INTRO_UNLOCK_PRICE_ID`. Keep
`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in that file as well; do not put
their values in the repository. Validate the environment safely:

```sh
pnpm exec varlock load --agent
```

## Each checkout run

Start the app in one terminal:

```sh
pnpm dev
```

In a second terminal, start the Stripe listener:

```sh
pnpm stripe:sandbox:listen
```

The listener prints a temporary webhook signing secret. Copy that value into
`STRIPE_WEBHOOK_SECRET` in `.env.development.local`, then restart `pnpm dev`.
Never paste the secret into chat, logs, or committed files.

Complete an intro-unlock checkout in the app using Stripe's test card
`4242 4242 4242 4242`, any future expiry date, and any CVC. Stripe forwards
`checkout.session.completed` to:

```text
POST http://localhost:3000/api/stripe-webhook
```

The route verifies the signature and fulfills the six-month intro access window.
Leave the listener running while testing retries or webhook delivery.

## Troubleshooting

- Run `pnpm stripe:sandbox:check` to confirm that `mise` resolves the CLI.
- Run `pnpm exec varlock load --agent` to validate configuration without
  revealing sensitive values.
- If the listener reports an authentication error, rerun
  `mise exec -- stripe login` yourself rather than passing an API key on the
  command line.
