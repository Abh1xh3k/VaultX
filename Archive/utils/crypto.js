const getTransactions = async (address) => {
  try {
    const response = await fetch(
      `https://testnet.toncenter.com/api/v2/getTransactions?address=${address}&limit=10&to_lt=0&archival=false`
     ,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
  }
};

const getBalance = async (address) => {
  try {
    const response = await fetch(
      `https://testnet.toncenter.com/api/v2/getAddressInformation?address=${address}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching balance:', error);
  }
};


module.exports = { getTransactions, getBalance };
