const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const Schema = mongoose.Schema;
const categorySchema = new Schema({
    categoryName: { type: String, required: true },
    categoryNumber: { type: Number, required: true, default: 0 },

});

categorySchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model('categories', categorySchema);