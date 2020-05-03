# Annotation Environment for Hyperwell

This application serves as an experimental annotation environment for testing real-time, collaborative annotation with the [Hyperwell gateway](https://github.com/hyperwell/gateway).

## Get started

You will need to have [Node.js](https://nodejs.org) installed. Install the dependencies via `npm install` and start the [Rollup development server](https://rollupjs.org) via `npm run dev`.

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. To test the annotation environment with a notebook provided by a Hyperwell gateway, obtain its gateway-issued URL (which is based on its ID, e.g., `http://gateway.example.com/annotatios/abcdef123`). Enter the full URL and make sure to check the Hyperwell option. By clicking the ‘Load Annotations’ button, the environment will fetch all existing annotations and establish a WebSocket connection for receiving real-time updates by collaborators.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.

## Building and running in production mode

To create an optimised version of the app:

```bash
npm run build
```

You can run the newly built app with `npm run start`. This uses [sirv](https://github.com/lukeed/sirv), which is included in your package.json's `dependencies` so that the app will work when you deploy to platforms like [Heroku](https://heroku.com).


## License

MIT
