# Contributing to freeLN

Thanks for your interest in freeLN, the free, fully-local markdown lab notebook.

## License of contributions

freeLN is released under the **Apache License 2.0** (see [`LICENSE`](./LICENSE)).
By contributing, you agree that your contributions are licensed under the same
terms — inbound = outbound. Apache-2.0 permits commercial and proprietary use,
so accepted contributions may also ship in the paid **sci-arch+** product.

## Developer Certificate of Origin (DCO)

We use the [DCO](https://developercertificate.org/) instead of a CLA. It's a
lightweight, one-line attestation that you wrote (or have the right to submit)
the change. Sign off every commit:

```bash
git commit -s -m "your message"
```

This appends a `Signed-off-by: Your Name <you@example.com>` trailer, certifying
the DCO. Commits without a sign-off can't be merged.

## Ground rules

- freeLN is **100% client-side** — it must never send a user's notebook content
  or files off the machine. PRs that add network calls touching note content
  will be declined. Keeping this verifiable is the whole reason the client is
  open source.
- Match the existing style (dependency-light; the app runs standalone with no
  backend or env vars).
- `yarn build` must pass.

## Trademarks

The Apache License covers the **code**, not the **name**. "freeLN", "sci-arch",
and the sci-arch logo are trademarks — a fork must use a different name and
branding. See the "Trademarks" section of the [README](./README.md).
