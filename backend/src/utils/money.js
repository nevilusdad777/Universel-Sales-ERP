const roundMoney = (value) => {
  if (typeof value === 'number') {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
  return value;
};

const formatMoneyFields = (data) => {
  if (Array.isArray(data)) {
    return data.map(formatMoneyFields);
  }
  
  if (data instanceof Date) {
    return data;
  }

  if (data !== null && typeof data === 'object') {
    const moneyFields = [
      'subTotal', 'discount', 'gst', 'grandTotal', 
      'outstandingAmount', 'creditLimit', 'amount', 
      'purchasePrice', 'sellingPrice', 'unitPrice'
    ];
    
    const result = Array.isArray(data) ? [] : {};
    for (const key of Object.keys(data)) {
      if (moneyFields.includes(key) && typeof data[key] === 'number') {
        result[key] = roundMoney(data[key]);
      } else if (typeof data[key] === 'object') {
        result[key] = formatMoneyFields(data[key]);
      } else {
        result[key] = data[key];
      }
    }
    return result;
  }
  return data;
};

module.exports = { formatMoneyFields, roundMoney };
