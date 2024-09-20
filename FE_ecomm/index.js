const baseUrl = `http://localhost:3000`
const clientIo = io(baseUrl)
displayData()

// ================= product data =================
$('.createProduct').click(async () => {
  // prepare data from  inputs
    const data = {
        title: $('.title').val(),
        // overview: $('.overview').val(),
        stock: $('.stock').val(),
        price: $('.price').val(),
        categoryId: $('.categoryId').val(),
        subCategoryId: $('.subCategoryId').val(),
        brandId: $('.brandId').val(),
    }
  // send data to server
await axios({
    method: 'POST',
    url: `${baseUrl}/products/add`,
    data,
    })
})


clientIo.on('newProduct', () => {
    displayData()
})

async function displayData() {
  // ================================= get all data by axios ==========================
await axios({
    method: 'GET',
    url: `${baseUrl}/products/`,
}).then((res) => {

    let cartona = ``

    for (const product of res.data.products) {
        cartona += `
        <div class="col-md-4 my-2">
            <div class="p-2 border border-success text-center" >
            <h3>${product.title}</h3>
            // <h3>${product.rating}</h3>
            <h3>${product.price}</h3>
            <h3>${product.stock}</h3>
            </div>
        </div>
        `
    }

        document.getElementById('rowData').innerHTML = cartona
    })
}
