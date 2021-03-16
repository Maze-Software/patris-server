const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const Schema = mongoose.Schema;
const adminSchema = new Schema({
    email: { type: String, required: true },
    attemptLeft: { type: Number, required: true }
});

adminSchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model('screenshots', adminSchema);