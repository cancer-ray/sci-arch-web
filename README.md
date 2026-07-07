# freeLN

The free, fully-local markdown electronic lab notebook — the client app behind
[sci-arch.ca](https://sci-arch.ca). It runs entirely in your browser: open your
`.md` files or a notebook folder, write, search, and export. **Nothing is ever
uploaded** — your notes never leave your device. That claim is why this client
is open source: you can read the code and verify it.

The paid cloud tiers (**sci-arch+**: soloLN / groupLN) are a separate,
proprietary product and are **not** included in this repository.

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## License

freeLN (this `frontend/` client) is licensed under the **Apache License 2.0** —
see [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE). You're free to use, modify,
and redistribute it, including commercially, subject to the license terms
(attribution, stating changes, the patent grant, and the trademark limits
below).

The **sci-arch+** backend (the GMP hash-chain audit engine, sign/lock,
compliance package, and billing) is a separate, proprietary product and is not
covered by this license.

Contributions are welcome under the same license and a lightweight DCO sign-off
— see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Trademarks

The Apache License grants rights to the **code**, not to the **brand**. Per
Apache-2.0 §6, it does **not** license the names **"freeLN"**, **"sci-arch"**,
or **"sci-arch+"**, or the sci-arch logo, which are trademarks of Ryan Lee /
sci-arch.

You may state, factually, that your project is built on or derived from freeLN.
You may **not** use these names or the logo as the name or branding of a fork,
a redistribution, or a product/service in a way that implies it is the official
freeLN or sci-arch, or is endorsed by sci-arch. If you fork and distribute,
please rename. Questions: ryan@sci-arch.ca.
