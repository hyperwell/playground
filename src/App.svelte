<script>
    import createDebug from 'debug'
    import Recogito from '@recogito/recogito-js'
    import { WebAnnotationAdapter } from 'recogito-web-annotation-adapter'
    import faust from '../faust.txt'

    createDebug.enable('annotation*')
    const debug = createDebug('annotation')

    let content, serverUrl, isHyperwell = true, submitted, recogito, annotationAdapter, endpoint

    function parseHyperwellUrl (gatewayUrl) {
        const url = new URL(gatewayUrl)
        const segments = url.pathname.split('/').filter(segment => segment.length)
        if (segments.length < 2 || segments[0] !== 'annotations') {
            throw new Error('not a valid notebook URL')
        }
        return {
            host: url.host,
            notebookId: segments[1]
        }
    }

    function setupHyperwell (recogito, endpoint) {
        const { host, notebookId } = parseHyperwellUrl(endpoint)
        const protocol = endpoint.startsWith('https') ? 'wss' : 'ws'
        const subscriptionEndpoint = `${protocol}://${host}/annotations/subscribe/${notebookId}`

        const ws = new WebSocket(subscriptionEndpoint)
        ws.onmessage = event => {
            const diff = JSON.parse(event.data)
            debug('real-time update', diff)

            for (const addedAnnotation of diff.inserted) {
                recogito.addAnnotation(addedAnnotation)
            }

            for (const changedAnnotation of diff.changed) {
                recogito.addAnnotation(changedAnnotation)
            }

            for (const deletedAnnotation of diff.deleted) {
                recogito.removeAnnotation(deletedAnnotation)
            }
        }
    }

    async function submit (event) {
        event.preventDefault()

        if (!serverUrl || submitted) {
            return
        }

        if (!serverUrl.endsWith('/')) {
            serverUrl = `${serverUrl}/`
        }

        const endpoint = serverUrl

        const targetSource = `${window.location}#${content.getAttribute('id')}`
        recogito = Recogito.init({ content })
        annotationAdapter = new WebAnnotationAdapter(recogito, targetSource, endpoint)
        annotationAdapter.getAnnotations()

        if (isHyperwell) {
            setupHyperwell(recogito, endpoint)
        }

        submitted = true
    }

    const verses = faust.split('\n\n').map(group => group.split('\n'))
</script>

<main>
    <header>
        <form on:submit={submit} disabled={submitted}>
            <div class="line">
                <label for="server-url" class="full">Annotation Server URL:</label>
                <input type="text" id="server-url" disabled={submitted} bind:value={serverUrl}/>
            </div>

            <div class="line">
                <label for="is-hyperwell">
                    <input type="checkbox" id="is-hyperwell" disabled={submitted} bind:checked={isHyperwell}/>
                    Hyperwell Gateway
                </label>
            </div>

            <button class="submit" disabled={!serverUrl || submitted}>Load Annotations</button>
        </form>
    </header>
    <div bind:this={content} class="chapter" class:disabled="{ submitted !== true }" id="faust">
        {#each verses as group}
            <p class="group">
                {#each group as verse}
                    {verse}<br/>
                {/each}
            </p>
        {/each}
    </div>
</main>

<style>
    header {
        box-sizing: border-box;
        width: 100%;
        margin: 0;
        padding: 25px;

        background: rgb(245, 245, 245);
        font: 400 14px/100% Inter, sans-serif;
    }

    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 100;
    }

    .line {
        display: flex;
        flex-direction: column;
        margin-bottom: 10px
    }

    label {


    }

    label.full {
        margin-bottom: 5px;
    }

    input[type=text] {
        width: 450px;
        padding: 8px 12px;
        border: 1px solid rgb(200, 200, 200);
        border-radius: 3px;

        transition: border-color 125ms ease-in-out;
    }

    input[type=text]:focus, input[type=text]:active {
        border-color: rgb(150, 150, 245);
    }

    button.submit {
        padding: 8px 12px;
        border: 0 none;
        border-radius: 3px;
        color: white;
        background-color: rgb(50, 50, 50);

        cursor: pointer;
        transition: background-color 125ms ease-in-out, opacity 125ms ease-in-out;
    }

    button.submit[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
    }

    button.submit:not([disabled]):hover {
        background-color: rgb(70, 70, 70);
    }

    .chapter {
        margin: 50px;
        font: 500 24px/150% 'EB Garamond', times, serif;
    }

    .chapter.disabled {
        opacity: 0.25;
        pointer-events: none;
    }

    p.group {
        margin-bottom: 30px;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }
</style>
