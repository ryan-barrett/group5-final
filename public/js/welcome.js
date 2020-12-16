/**
 * API calls
 */

async function getGroceryPhoto(photoId) {
  const response = await fetch(`/grocery/photo/${photoId}`);
  return await response.json();
}

async function getNearbyGroceryStore(lat, long) {
  const response = await fetch(`/grocery/nearby/${lat}/${long}`);
  return await response.json();
}

async function fetchProducts(productName) {
  const response = await fetch(`/grocery/search?query=${productName}`);
  const { products } = await response.json();
  return products;
}

// TODO: this will be faster if we organize the data on the backend
async function fetchNearbyByCurrentPosition({ coords: { latitude, longitude } }) {
  const stores = await getNearbyGroceryStore(latitude, longitude);
  return await Promise.all(stores.map((store) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { geometry, business_status: businessStatus, mapsUrl, name, place_id: placeId, vicinity } = store;
        const photoId = store.photos ? store.photos[0].photo_reference : null;
        const urlObj = photoId ? await getGroceryPhoto(photoId) : null;
        resolve({ geometry, businessStatus, mapsUrl, name, placeId, vicinity, photoUrl: (urlObj ? urlObj.url : null) });
      }
      catch (error) {
        reject(error);
      }
    });
  }));
}

/**
 * functions that render / update the page
 */

async function prepStores(position) {
  const stores = await fetchNearbyByCurrentPosition(position);
  const storesDiv = document.getElementById('stores');
  const storeContainer = document.createElement('div');
  storeContainer.id = 'store-container';
  storeContainer.classList.add('row','row-cols-3');

  const selectStore = document.createElement('h1');
  selectStore.innerText = 'Select a Store';
  storesDiv.appendChild(selectStore);

  for (const store of stores) {
    if (!store.photoUrl) {
      continue;
    }
    const storeDiv = document.createElement('div');
    storeDiv.classList.add('store-unit', 'col');

    const leftCol = document.createElement('div');
    leftCol.classList.add('store-leftcol');
    storeDiv.appendChild(leftCol);

    const rightCol = document.createElement('div');
    rightCol.classList.add('store-rightcol');
    storeDiv.appendChild(rightCol);

    const name = document.createElement('h3');
    name.innerText = store.name;
    rightCol.appendChild(name);

    const storeImgLink = document.createElement('a');
    storeImgLink.href = '#';
    leftCol.appendChild(storeImgLink);

    const storeImg = document.createElement('img');
    storeImg.classList.add('store-img');
    storeImg.src = store.photoUrl;
    storeImgLink.appendChild(storeImg);

    const addressDiv = document.createElement('div');
    addressDiv.innerText = store.vicinity;
    rightCol.appendChild(addressDiv);

    const mapsLink = document.createElement('a');
    mapsLink.href = store.mapsUrl;
    mapsLink.target = '_blank';
    mapsLink.innerText = 'Google Maps';
    rightCol.appendChild(mapsLink);

    storeContainer.appendChild(storeDiv);
  }
  storesDiv.appendChild(storeContainer);

  const selectStoreButton = document.getElementById('select-store');
  selectStoreButton.innerText = 'Select Store';
  selectStoreButton.disabled = false;
  initStoreClickHandler();
}

function displayStores() {
  const stores = document.getElementById('stores');
  stores.removeAttribute('hidden');
}

function displayProductSearch() {
  const productSearchContainer = document.createElement('div');
  const newInput = document.createElement('input');
  newInput.id = 'product-search-input';

  const productSearchTitle = document.createElement('h1');
  productSearchTitle.innerText = 'Search for products!';

  const searchButton = document.createElement('button');
  searchButton.id = 'product-search-button';
  searchButton.innerText = 'Search!';

  productSearchContainer.appendChild(productSearchTitle);
  productSearchContainer.appendChild(newInput);
  productSearchContainer.appendChild(searchButton);

  const productSearch = document.getElementById('product-search');
  productSearch.appendChild(productSearchContainer);
  productSearch.removeAttribute('hidden');
  initProductSearchHandler();
}

async function renderProducts(productName) {
  const products = await fetchProducts(productName);
  const productList = document.getElementById('product-list');
  productList.classList.add('row','row-cols-3');

  for (const product of products) {
    const newListItem = document.createElement('div');
    newListItem.classList.add('product-list-item', 'col');

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('list-item-images');
    newListItem.appendChild(imageContainer);

    const itemImg = document.createElement('img');
    itemImg.classList.add('product-image');
    itemImg.src = product.image;
    imageContainer.appendChild(itemImg);

    const itemTitle = document.createElement('h3');
    itemTitle.innerText = product.title;
    newListItem.appendChild(itemTitle);

    const cartImg = document.createElement('img');
    cartImg.src = '../img/cart-icon.jpg';
    cartImg.classList.add('cart-img');
    newListItem.appendChild(cartImg);

    productList.appendChild(newListItem);
  }
  initAddProductToCartHandler();
  productList.removeAttribute('hidden');
}

function clearProductList() {
  const productList = document.getElementById('product-list');
  productList.innerHTML = '';
}

function addItemToCart(item) {
  item.src = '../img/checkmark-icon.png';
  item.inCart = true;
  alert('this is where I would add to cart');
}

function removeItemFromCart(item) {
  item.src = '../img/cart-icon.jpg';
  item.inCart = false;
  alert('this is where I would remove from cart!');
}

/**
 * Event handlers
 */

function selectStoreButtonHandler() {
  const selectStore = document.getElementById('select-store');
  selectStore.addEventListener('click', function (event) {
    event.preventDefault();
    displayStores();
  });
}

function initStoreClickHandler() {
  const storePhotos = document.querySelectorAll('.store-img');
  storePhotos.forEach((img) => {
    img.addEventListener('click', function (event) {
      const storesDiv = document.getElementById('stores');
      storesDiv.remove();
      displayProductSearch();
    });
  });
}

function initProductSearchHandler() {
  const productSearchButton = document.getElementById('product-search-button');
  productSearchButton.addEventListener('click', async function (event) {
    event.preventDefault();
    const productSearchInput = document.getElementById('product-search-input');
    const productName = productSearchInput.value;

    clearProductList();
    await renderProducts(productName);
  });
}

function initAddProductToCartHandler() {
  const cartIcons = document.querySelectorAll('.cart-img');
  for (const cartIcon of cartIcons) {
    cartIcon.addEventListener('click', function (event) {
      const item = event.target;

      if (item.inCart) {
        removeItemFromCart(item);
      }
      else {
        addItemToCart(item);
      }
    });
  }
}

/**
 * gets the user location and kicks off the flow
 */

async function getUserLatLong() {
  await navigator.geolocation.getCurrentPosition(prepStores);
}

async function main() {
  selectStoreButtonHandler();
  await getUserLatLong();
}

main().then(() => {
  console.log('retrieved data');
});
