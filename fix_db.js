const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/').then(async () => {
  const db = mongoose.connection.db;
  const res = await db.collection('companysettings').updateMany(
    { address: '101, Business Enclave, Cyber City, Sector 45, Gurgaon, Haryana', shopName: { $ne: 'IntellectBill AI Store' } },
    { $set: { address: '', phoneNumber: '', gstin: '', logoUrl: '' } }
  );
  console.log('Fixed ' + res.modifiedCount + ' profiles.');
  process.exit(0);
});
