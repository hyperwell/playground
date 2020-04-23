<script>
    import createDebug from 'debug'
    import Recogito from '../lib/recogito-0.1.2.min'
    import faust from '../faust.txt'

    createDebug.enable('annotation*')
    const debug = createDebug('annotation')

    let content, serverUrl, isHyperwell = true, submitted, r, endpoint

    function parseHyperwellUrl(gatewayUrl) {
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

    async function submit(event) {
        event.preventDefault()

        if (!serverUrl || submitted) {
            return
        }

        if (!serverUrl.endsWith('/')) {
            serverUrl = `${serverUrl}/`
        }

        const endpoint = serverUrl
        const res = await fetch(serverUrl, {
            headers: {
                "Content-Type": "application/json"
            }
        })
        const data = await res.json()

        const r = Recogito.init({content});
        r.setAnnotations(data)

        r.on("createAnnotation", async (annotation) => {
            debug('create')
            if (annotation.id) {
                delete annotation.id
            }

            await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                redirect: "follow",
                body: JSON.stringify(annotation)
            });
        });

        r.on("updateAnnotation", async (annotation) => {
            debug('update', annotation.id)
            await fetch(annotation.id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                redirect: "follow",
                body: JSON.stringify(annotation)
            });
        });

        if (isHyperwell) {
            const {host, notebookId} = parseHyperwellUrl(endpoint)
            const subscriptionEndpoint = `ws://${host}/annotations/subscribe/${notebookId}`

            const ws = new WebSocket(subscriptionEndpoint);
            ws.onmessage = event => {
                const diff = JSON.parse(event.data);
                debug('real-time update', diff)

                for (const addedAnnotation of diff.inserted) {
                    r.addAnnotation(addedAnnotation);
                }

                for (const changedAnnotation of diff.changed) {
                    r.addAnnotation(changedAnnotation);
                }
            };
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
    <div bind:this={content} class="chapter" class:disabled="{ submitted !== true }">
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
