const CART_KEY = 'cafeTayoCart';
const DELIVERY_FEE = 35;

const SIZE_PRICE_MAP = {
  S: 0,
  Small: 0,
  M: 25,
  Medium: 25,
  L: 45,
  Large: 45,
};

document.addEventListener('DOMContentLoaded', () => {
  bindAddButtons();
  bindSelectionCards();
  bindCheckoutEvents();
  updateCartUI();
});

function bindAddButtons() {
  document.querySelectorAll('.add-btn, .add-home').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openSizeModal(button);
    });
  });
}

function bindSelectionCards() {
  const choiceCards = document.querySelectorAll('.choice-card');
  const paymentOptions = document.querySelectorAll('.payment-option');

  choiceCards.forEach((card) => {
    const input = card.querySelector('input');
    input.addEventListener('change', () => {
      choiceCards.forEach((item) => item.classList.toggle('selected', item === card));
      const deliverySelected = document.querySelector('input[name="fulfillment"][value="Delivery"]:checked');
      const addressWrap = document.getElementById('address-wrap');
      if (addressWrap) {
        addressWrap.hidden = !deliverySelected;
        const textarea = addressWrap.querySelector('textarea');
        if (deliverySelected) {
          textarea.setAttribute('required', 'required');
        } else {
          textarea.removeAttribute('required');
        }
      }
      updateCartUI();
    });
  });

  paymentOptions.forEach((card) => {
    const input = card.querySelector('input');
    input.addEventListener('change', () => {
      paymentOptions.forEach((item) => item.classList.toggle('selected', item === card));
    });
  });
}

function bindCheckoutEvents() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const cart = readCart();
    if (!cart.length) {
      showToast('Your cart is empty. Add a drink or treat first.');
      return;
    }

    const formData = new FormData(form);
    const name = String(formData.get('customerName') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const fulfillment = String(formData.get('fulfillment') || 'Pickup');
    const payment = String(formData.get('payment') || 'Cash');
    const address = String(formData.get('address') || '').trim();

    if (!name || !phone) {
      showToast('Please fill in your name and mobile number.');
      return;
    }

    if (fulfillment === 'Delivery' && !address) {
      showToast('Please add a delivery address.');
      return;
    }

    const total = calculateTotal();
    const receiptNumber = `CT-${Math.floor(100000 + Math.random() * 900000)}`;
    const modal = document.getElementById('success-modal');
    const message = document.getElementById('success-message');
    const receipt = document.getElementById('receipt-number');

    message.textContent = `${name}, your ${payment} order is confirmed for ${fulfillment.toLowerCase()}. Total: ${formatPrice(total)}.`;
    receipt.textContent = `Receipt #${receiptNumber}`;
    modal.hidden = false;
    clearCart();
    updateCartUI();
    form.reset();
    const defaultPickup = document.querySelector('input[name="fulfillment"][value="Pickup"]');
    if (defaultPickup) {
      defaultPickup.checked = true;
      defaultPickup.closest('.choice-card').classList.add('selected');
      document.querySelectorAll('.choice-card').forEach((card) => {
        const input = card.querySelector('input');
        card.classList.toggle('selected', input.checked);
      });
    }
    const defaultPayment = document.querySelector('input[name="payment"][value="Cash"]');
    if (defaultPayment) {
      defaultPayment.checked = true;
      defaultPayment.closest('.payment-option').classList.add('selected');
      document.querySelectorAll('.payment-option').forEach((card) => {
        const input = card.querySelector('input');
        card.classList.toggle('selected', input.checked);
      });
    }
    const addressWrap = document.getElementById('address-wrap');
    if (addressWrap) {
      addressWrap.hidden = true;
      addressWrap.querySelector('textarea').removeAttribute('required');
    }
  });

  const finishButton = document.getElementById('finish-order');
  if (finishButton) {
    finishButton.addEventListener('click', () => {
      const modal = document.getElementById('success-modal');
      if (modal) {
        modal.hidden = true;
      }
      window.location.href = 'index.html';
    });
  }

  const fulfillmentInputs = document.querySelectorAll('input[name="fulfillment"]');
  fulfillmentInputs.forEach((input) => {
    input.addEventListener('change', updateCartUI);
  });
}

function openSizeModal(button) {
  const product = {
    name: button.dataset.name,
    price: Number(button.dataset.price || 0),
    category: button.dataset.category || 'Coffee',
    image: button.dataset.image || '',
  };

  const modal = document.getElementById('size-modal') || createSizeModal();
  const isDrink = product.category !== 'Dessert';

  const sizeOptions = isDrink
    ? [
        { label: 'Small', value: 'S', extra: 0 },
        { label: 'Medium', value: 'M', extra: 25 },
        { label: 'Large', value: 'L', extra: 45 },
      ]
    : [{ label: 'Regular', value: 'Regular', extra: 0 }];

  const listHtml = sizeOptions
    .map((option) => {
      const total = product.price + option.extra;
      const checked = option.value === 'M' || option.value === 'Regular' ? 'checked' : '';
      return `
        <label class="size-option ${checked ? 'selected' : ''}">
          <input type="radio" name="drink-size" value="${option.value}" data-extra="${option.extra}" ${checked}>
          <span>
            <b>${option.label}</b>
            <small>${formatPrice(total)}</small>
          </span>
        </label>
      `;
    })
    .join('');

  modal.innerHTML = `
    <div class="size-picker" role="dialog" aria-modal="true" aria-labelledby="size-title">
      <div class="size-picker-header">
        <div>
          <p class="eyebrow">CHOOSE YOUR SIZE</p>
          <h3 id="size-title">${product.name}</h3>
        </div>
        <button type="button" class="close-size" aria-label="Close size picker">×</button>
      </div>
      <div class="size-picker-grid">${listHtml}</div>
      <div class="size-modal-actions">
        <button type="button" class="btn btn-light close-size">Cancel</button>
        <button type="button" class="btn btn-dark add-selected-item">Add to cart</button>
      </div>
    </div>
  `;

  modal.hidden = false;

  const sizeInputs = modal.querySelectorAll('input[name="drink-size"]');
  sizeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      modal.querySelectorAll('.size-option').forEach((option) => option.classList.toggle('selected', option.querySelector('input').checked));
    });
  });

  modal.querySelector('.close-size').addEventListener('click', () => {
    modal.hidden = true;
  });

  modal.querySelector('.add-selected-item').addEventListener('click', () => {
    const selectedInput = modal.querySelector('input[name="drink-size"]:checked');
    const size = selectedInput ? selectedInput.value : 'Regular';
    const extra = Number(selectedInput ? selectedInput.dataset.extra : 0);
    addItemToCart({
      name: product.name,
      price: Number(product.price) + extra,
      category: product.category,
      image: product.image,
      size,
    });
    modal.hidden = true;
  });

  if (modal.dataset.bound === 'true') {
    return;
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.hidden = true;
    }
  });
  modal.dataset.bound = 'true';
}

function createSizeModal() {
  const modal = document.createElement('div');
  modal.id = 'size-modal';
  modal.className = 'modal-backdrop';
  modal.hidden = true;
  document.body.appendChild(modal);
  return modal;
}

function addItemToCart(item) {
  const cart = readCart();
  const key = `${item.name}-${item.size || 'Regular'}`;
  const index = cart.findIndex((entry) => `${entry.name}-${entry.size || 'Regular'}` === key);

  if (index >= 0) {
    cart[index].quantity += 1;
  } else {
    cart.push({
      id: key,
      name: item.name,
      category: item.category,
      image: item.image,
      size: item.size || 'Regular',
      price: Number(item.price || 0),
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartUI();
  showToast(`${item.name} (${item.size || 'Regular'}) added to cart.`);
}

function readCart() {
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn('Cart load failed:', error);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn('Cart save failed:', error);
  }
}

function clearCart() {
  saveCart([]);
}

function updateCartUI() {
  const cart = readCart();
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach((countNode) => {
    countNode.textContent = totalQty;
  });

  const emptyState = document.getElementById('empty-cart');
  const cartItems = document.getElementById('cart-items');
  const totals = document.getElementById('summary-totals');

  if (!cartItems || !emptyState || !totals) {
    return;
  }

  if (!cart.length) {
    emptyState.hidden = false;
    cartItems.innerHTML = '';
    totals.style.display = 'none';
    return;
  }

  emptyState.hidden = true;
  cartItems.innerHTML = cart.map((item) => `
    <div class="cart-row">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h3>${item.name}</h3>
        <div class="item-price">${item.size || 'Regular'} · ${formatPrice(item.price)}</div>
        <div class="quantity-control">
          <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increase" data-id="${item.id}" aria-label="Increase quantity">＋</button>
        </div>
      </div>
      <div>
        <div class="line-price">${formatPrice(item.price * item.quantity)}</div>
        <button type="button" class="remove-item" data-action="remove" data-id="${item.id}">Remove</button>
      </div>
    </div>
  `).join('');

  totals.style.display = 'block';
  const subtotalValue = calculateSubtotal();
  document.getElementById('subtotal').textContent = formatPrice(subtotalValue);
  const deliveryValue = isDeliverySelected() ? DELIVERY_FEE : 0;
  document.getElementById('delivery-fee').textContent = formatPrice(deliveryValue);
  document.getElementById('total').textContent = formatPrice(subtotalValue + deliveryValue);

  cartItems.querySelectorAll('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const id = button.dataset.id;
      const updatedCart = readCart();
      const itemIndex = updatedCart.findIndex((entry) => entry.id === id);

      if (itemIndex === -1) return;

      if (action === 'increase') {
        updatedCart[itemIndex].quantity += 1;
      }
      if (action === 'decrease') {
        updatedCart[itemIndex].quantity -= 1;
      }
      if (action === 'remove' || updatedCart[itemIndex].quantity <= 0) {
        updatedCart.splice(itemIndex, 1);
      }

      saveCart(updatedCart);
      updateCartUI();
    });
  });
}

function calculateSubtotal() {
  return readCart().reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
}

function calculateTotal() {
  return calculateSubtotal() + (isDeliverySelected() ? DELIVERY_FEE : 0);
}

function isDeliverySelected() {
  const deliveryInput = document.querySelector('input[name="fulfillment"][value="Delivery"]');
  return deliveryInput ? deliveryInput.checked : false;
}

function formatPrice(value) {
  return `₱${Number(value || 0).toFixed(0)}`;
}

function showToast(message) {
  const toast = document.querySelector('.toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove('show'), 2200);
}
