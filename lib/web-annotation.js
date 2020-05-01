export async function fetchAnnotations(endpoint) {
  const container = await (await fetch(endpoint)).json()
  if (!container.first) {
    return []
  }

  let collection = []
  let nextPage = container.first
  do {
    const page = await (await fetch(nextPage)).json()
    collection = collection.concat(page.items)
    nextPage = page.next
  } while (nextPage)

  return collection
}
