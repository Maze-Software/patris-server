const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const Schema = mongoose.Schema;
const watchedInfoSchema = new Schema({
    userId: { type: String, required: true },
    videoId: { type: String, required: true },
    timeOfWatched: { type: Number, required: true }

});

watchedInfoSchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model('watchedInfo', watchedInfoSchema);