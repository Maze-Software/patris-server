const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const Schema = mongoose.Schema;
const videoPartsSchema = new Schema({
    videoId: { type: String, required: true },
    minute: { type: String, required: true },
    text: { type: String, required: true },

});

videoPartsSchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model('videoParts', videoPartsSchema);