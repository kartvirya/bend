const axios = require('axios');

axios.get('https://www.outix.co/thirdparty/getcategoriesround/ladder/SUPER_GAS?displaydate=2025-03-01', {
    headers: { 'Authorization': 'Bearer UY_eAWHxXHT6Adb8OBIit0txV6SjHVFC3H_2_Em_hy0=' }
})
.then(response => console.log(response.data))
.catch(error => console.error('Error:', error));
