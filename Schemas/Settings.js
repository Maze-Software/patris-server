const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const Schema = mongoose.Schema;
const settingsSchema = new Schema({
    mainColor: { type: String, required: true },
    secondColor: { type: String, required: true },
    shareButton: { type: String, required: true },
    profileColor: { type: String, required: true },
    faqColor: { type: String, required: true },
    savedColor: { type: String, required: true },
    contact: { type: String, required: true },
    navigationColor: { type: String, required: true },
    pageBackgroundColor: { type: String, required: true },
    share: { type: String, required: false, default: "" },
});

settingsSchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model('settings', settingsSchema);