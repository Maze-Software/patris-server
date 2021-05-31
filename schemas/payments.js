const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const Schema = mongoose.Schema;
const paymentsSchema = new Schema({
    userId: { type: String, required: true },
    iyziCoToken: { type: String, required: true },
    amount: { type: Number, required: true },
    subscriptionType: { type: Number, required: true },
    date: { type: Date, required: true },
    isPaid: { type: Boolean, required: true, default: false },
    priceId: { type: String, required: true },
    customerId: { type: String, required: false },
    paymentId: { type: String, required: false },

});

paymentsSchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model('payments', paymentsSchema);