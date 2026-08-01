export function TextureBackdrop() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 -z-10"
			style={{
				backgroundImage:
					'radial-gradient(circle, color-mix(in oklch, var(--sky) 55%, transparent) 1px, transparent 1.5px)',
				backgroundSize: '22px 22px',
			}}
		/>
	)
}
