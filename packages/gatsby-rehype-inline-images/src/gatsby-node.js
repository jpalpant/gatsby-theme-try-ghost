const _ = require(`lodash`)
const visit = require(`unist-util-visit`)
const { createRemoteFileNode } = require(`gatsby-source-filesystem`)

module.exports = async ({
    htmlAst,
    htmlNode,
    actions: { createNode, getNode },
    createNodeId,
    store,
    cache,
    reporter,
}, pluginOptions) => {

    const config = getNode(`gatsby-theme-try-ghost-config`)
    const basePath = config && config.basePath || `/`

    const url = htmlNode && htmlNode.context && htmlNode.context.url
    const slug = htmlNode && htmlNode.context && htmlNode.context.slug
    reporter.info(`Node URL is ${url}`)

    if (!url && slug){
        reporter.info(`Expected url and slug not defined.`)
        return htmlAst
    }

    function isUrl(s) {
        const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/
        return regexp.test(s)
    }

    const cmsUrl = _.head(_.split(url, slug, 1))
    if (!isUrl(cmsUrl)) {
        return htmlAst
    }

    reporter.info(`CMS URL is ${cmsUrl}`)

    visit(htmlAst, { tagName: `img` }, (node) => {
        // get all <img /> tags and their src property
        const src = node.properties && node.properties.src

        // if the image source is an uploaded image at the Ghost CMS URL, download it
        if (src && _.startsWith(src, cmsUrl)) {
            reporter.info(`Source is ${src}`)

            let fileNode
            try {
                // can't use await inside synchronous function. Will have to redo this.
                // consider interacting with cache the way gatsby-remark-images-anywhere does https://github.com/d4rekanguok/gatsby-remark-images-anywhere/blob/master/src/util-download-image.ts#L18-L57
                // fileNode = await createRemoteFileNode({
                //     url: src,
                //     parentNodeId: node.id,
                //     createNode,
                //     createNodeId,
                //     cache,
                //     store,
                // })
            } catch (e){
                reporter.warn(`Remote image failure.`)
                return
            }
            // process the image with sharp
            // Example: https://github.com/d4rekanguok/gatsby-remark-images-anywhere/blob/master/src/util-download-image.ts#L62
            // sharpMethod can be ('fluid', 'fixed', or 'resize'); gatsby-remark-images-anywhere does config for this in index.js: https://github.com/d4rekanguok/gatsby-remark-images-anywhere/blob/master/src/index.ts

            // Then, we need a local path to the static image.
            // gatsby-plugin-ghost-images seems to produce <picture /> elements, but the image sources are /static/{long random string}/{short random string}/{original filename}
            // but that's all baked into the React component and GraphQL, I think.

            // const relImageSrcUrl = ""
            const relImageSrcUrl = null;
            node.properties.src = relImageSrcUrl ? relImageSrcUrl : 'https://placekitten.com/1200/800'
        }
    })

    return htmlAst
}
