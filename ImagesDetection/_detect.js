//modeule for check sex content
const axios = require("axios")
const tf = require('@tensorflow/tfjs-node')
const nsfw = require('nsfwjs')




module.exports = async (url) => {
    const pic = await axios.get(url, {
        responseType: 'arraybuffer',
    })

    const model = await nsfw.load() // load the model


    const image = await tf.node.decodeImage(pic.data, 3)
    //decode the images
    const predictions = await model.classify(image)
    image.dispose() // Tensor memory must be managed explicitly (it is not sufficient to let a tf.Tensor go out of scope for its memory to be released).
    console.log({ predictions })
    const result = predictions.filter(prediction => {
        return {
            className: prediction.className,
            probability: (prediction.probability * 100) >= 20
        }
    })
    return result


}