const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    hash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    country: { type: String, required: false },
    city: { type: String, required: false },
    university: { type: String, required: false },
    grade: { type: String, required: false },
});

userSchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model('users', userSchema);