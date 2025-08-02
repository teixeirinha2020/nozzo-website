class BuyMoreSaveMore {
    constructor() {
      this.container = document.querySelector('.buy-more-save-more');
      this.currentPurchaseType = 'onetime';
      this.currentGroupId = null;
      this.currentSellingPlan = null;
      this.currentQuantity = 2; // Default to most popular option
      
      if (!this.container) return;
      
      this.init();
    }
  
    init() {
      this.bindEvents();
      this.updateVariantId();
      this.setDefaultQuantity();
    }
  
    bindEvents() {
      // Purchase type toggle
      const purchaseTypeInputs = document.querySelectorAll('input[name="purchase-type"]');
      purchaseTypeInputs.forEach(input => {
        input.addEventListener('change', this.handlePurchaseTypeChange.bind(this));
      });
  
      // Quantity selection for one-time purchase
      const quantityInputs = document.querySelectorAll('input[name="quantity-choice"]');
      quantityInputs.forEach(input => {
        input.addEventListener('change', this.handleQuantityChange.bind(this));
      });
  
      // Subscription plan selection
      const subscriptionInputs = document.querySelectorAll('input[name="subscription-plan"]');
      subscriptionInputs.forEach(input => {
        input.addEventListener('change', this.handleSubscriptionPlanChange.bind(this));
      });
  
      // Add to cart button
      const addToCartBtn = this.container.querySelector('.add-to-cart-btn2');
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', this.handleAddToCart.bind(this));
      }
  
      // Listen for variant changes
      document.addEventListener('change', this.handleVariantChange.bind(this));
      document.addEventListener('variantChange', this.updateVariantId.bind(this));
    }
  
    handlePurchaseTypeChange(event) {
      const value = event.target.value;
      const label = event.target.closest('.toggle-option');
      
      console.log('Purchase type changed to:', value); // Debug log
      
      if (!label) return;
  
      // Update active state
      document.querySelectorAll('.toggle-option').forEach(option => {
        option.classList.remove('active');
      });
      label.classList.add('active');
  
      // Show/hide appropriate sections
      if (value === 'onetime') {
        this.showOneTimeOptions();
        this.currentPurchaseType = 'onetime';
        this.currentGroupId = null;
        this.currentSellingPlan = null;
      } else if (value.startsWith('subscription-')) {
        const groupId = value.replace('subscription-', '');
        console.log('Extracted group ID:', groupId); // Debug log
        
        this.showSubscriptionOptions(groupId);
        this.currentPurchaseType = 'subscription';
        this.currentGroupId = groupId;
        
        // Select first plan by default
        const firstPlan = document.querySelector(`.subscription-plans[data-group-id="${groupId}"] input[name="subscription-plan"]`);
        console.log('First plan found:', firstPlan); // Debug log
        
        if (firstPlan) {
          firstPlan.checked = true;
          this.currentSellingPlan = firstPlan.value;
          console.log('Selected selling plan:', this.currentSellingPlan); // Debug log
        }
      }
  
      this.updateButtonText();
    }
  
    handleQuantityChange(event) {
      this.currentQuantity = parseInt(event.target.value);
    }
  
    handleSubscriptionPlanChange(event) {
      this.currentSellingPlan = event.target.value;
    }
  
    showOneTimeOptions() {
      // Show quantity options
      const quantityOptions = document.querySelector('.quantity-options[data-purchase-type="onetime"]');
      if (quantityOptions) {
        quantityOptions.style.display = 'flex';
      }
  
      // Hide all subscription plans
      const subscriptionPlans = document.querySelectorAll('.subscription-plans');
      subscriptionPlans.forEach(plan => {
        plan.style.display = 'none';
      });
    }
  
    showSubscriptionOptions(groupId) {
      console.log('Showing subscription options for group:', groupId); // Debug log
      
      // Hide quantity options
      const quantityOptions = document.querySelector('.quantity-options[data-purchase-type="onetime"]');
      if (quantityOptions) {
        quantityOptions.style.display = 'none';
      }
  
      // Hide all subscription plans first
      const allSubscriptionPlans = document.querySelectorAll('.subscription-plans');
      allSubscriptionPlans.forEach(plan => {
        plan.style.display = 'none';
      });
  
      // Show specific group's plans
      const targetPlans = document.querySelector(`.subscription-plans[data-group-id="${groupId}"]`);
      console.log('Target plans element:', targetPlans); // Debug log
      
      if (targetPlans) {
        targetPlans.style.display = 'block';
        console.log('Successfully showed subscription plans'); // Debug log
      } else {
        console.error('Could not find subscription plans for group:', groupId); // Debug log
      }
    }
  
    updateButtonText() {
      const button = this.container.querySelector('.add-to-cart-btn2 .button-text');
      if (!button) return;
  
      if (this.currentPurchaseType === 'subscription') {
        button.textContent = 'Subscribe Now';
      } else {
        // Reset to original text or default
        button.textContent = button.getAttribute('data-original-text') || 'Add to Cart';
      }
    }
  
    setDefaultQuantity() {
      // Set default quantity to most popular option (index 2)
      const defaultQuantityInput = document.querySelector('input[name="quantity-choice"]:checked');
      if (defaultQuantityInput) {
        this.currentQuantity = parseInt(defaultQuantityInput.value);
      }
    }
  
    updateVariantId() {
      const variantIdField = document.querySelector('form[action*="/cart/add"] [name="id"]');
      
      if (variantIdField && this.container) {
        this.container.dataset.variantId = variantIdField.value;
      }
    }
  
    handleVariantChange(event) {
      if (event.target && event.target.matches('form[action*="/cart/add"] [name="id"]')) {
        this.updateVariantId();
      }
    }
  
    async handleAddToCart() {
      if (!this.container) return;
  
      const variantId = parseInt(this.container.dataset.variantId);
      if (!variantId) {
        console.error('No variant ID found');
        return;
      }
  
      try {
        let formData;
  
        if (this.currentPurchaseType === 'subscription' && this.currentSellingPlan) {
          // Add with subscription
          formData = {
            items: [{
              id: variantId,
              quantity: 1, // Subscriptions typically use quantity 1
              selling_plan: this.currentSellingPlan,
              properties: {
                '_subscription': 'true',
                '_selling_plan_group': this.currentGroupId
              }
            }]
          };
        } else {
          // Add without subscription (one-time purchase)
          formData = {
            items: [{
              id: variantId,
              quantity: this.currentQuantity,
              properties: {
                '_discount_quantity': this.currentQuantity
              }
            }]
          };
        }
  
        const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Cart add failed:', errorText);
          this.showError('Failed to add item to cart. Please try again.');
          return;
        }
  
        const cartData = await response.json();
        
        // Update cart UI
        await this.updateCartUI(cartData);
        
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.showError('An error occurred. Please try again.');
      }
    }
  
    async updateCartUI(cartData) {
      try {
        // Get sections to render
        const sectionsToRender = [
          {
            id: 'cart-drawer',
            section: 'cart-drawer',
            selector: '.drawer__inner'
          },
          {
            id: 'cart-icon-bubble',
            section: 'cart-icon-bubble',
            selector: '.shopify-section'
          }
        ];
  
        // Fetch the sections HTML
        const sectionsUrl = `${window.location.pathname}?sections=${sectionsToRender.map(section => section.section).join(',')}`;
        const sectionsResponse = await fetch(sectionsUrl);
        
        if (!sectionsResponse.ok) {
          throw new Error('Failed to fetch sections');
        }
        
        const sectionsJson = await sectionsResponse.json();
  
        // Find cart drawer
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer) {
          // Update sections data
          cartData.sections = sectionsJson;
          
          // Remove is-empty class if present
          cartDrawer.classList.remove('is-empty');
          
          // Render new contents
          if (typeof cartDrawer.renderContents === 'function') {
            cartDrawer.renderContents(cartData);
          }
  
          // Ensure drawer is visible
          cartDrawer.setAttribute('open', '');
          cartDrawer.classList.add('animate', 'active');
          document.body.classList.add('overflow-hidden');
        }
  
        // Update cart count in header
        const cartIconBubble = document.getElementById('cart-icon-bubble');
        if (cartIconBubble && sectionsJson['cart-icon-bubble']) {
          cartIconBubble.innerHTML = sectionsJson['cart-icon-bubble'];
        }
  
        // Trigger cart update events
        document.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { cart: cartData }
        }));
  
      } catch (error) {
        console.error('Error updating cart UI:', error);
        // Fallback: reload the page
        window.location.reload();
      }
    }
  
    showError(message) {
      // Create or update error message
      let errorElement = this.container.querySelector('.error-message');
      
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.cssText = `
          background: #fee;
          color: #c53030;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
          border: 1px solid #feb2b2;
        `;
        this.container.insertBefore(errorElement, this.container.querySelector('.add-to-cart-btn2'));
      }
      
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // Hide error after 5 seconds
      setTimeout(() => {
        if (errorElement) {
          errorElement.style.display = 'none';
        }
      }, 5000);
    }
  
    // Public method to get current selection state
    getCurrentSelection() {
      return {
        purchaseType: this.currentPurchaseType,
        quantity: this.currentQuantity,
        sellingPlan: this.currentSellingPlan,
        groupId: this.currentGroupId,
        variantId: this.container ? parseInt(this.container.dataset.variantId) : null
      };
    }
  
    // Public method to update selection programmatically
    updateSelection(options = {}) {
      if (options.purchaseType && options.purchaseType !== this.currentPurchaseType) {
        const input = document.querySelector(`input[name="purchase-type"][value="${options.purchaseType}"]`);
        if (input) {
          input.checked = true;
          input.dispatchEvent(new Event('change'));
        }
      }
  
      if (options.quantity && this.currentPurchaseType === 'onetime') {
        const input = document.querySelector(`input[name="quantity-choice"][value="${options.quantity}"]`);
        if (input) {
          input.checked = true;
          input.dispatchEvent(new Event('change'));
        }
      }
  
      if (options.sellingPlan && this.currentPurchaseType === 'subscription') {
        const input = document.querySelector(`input[name="subscription-plan"][value="${options.sellingPlan}"]`);
        if (input) {
          input.checked = true;
          input.dispatchEvent(new Event('change'));
        }
      }
    }
  }
  
  // Utility functions for theme integration
  window.BuyMoreSaveMoreUtils = {
    // Get all instances
    getInstances: () => {
      return window.buyMoreSaveMoreInstances || [];
    },
  
    // Get instance by container element
    getInstance: (container) => {
      const instances = window.buyMoreSaveMoreInstances || [];
      return instances.find(instance => instance.container === container);
    },
  
    // Initialize specific container
    initContainer: (container) => {
      if (!container || container.classList.contains('bmsmInitialized')) return;
      
      container.classList.add('bmsmInitialized');
      const instance = new BuyMoreSaveMore(container);
      
      if (!window.buyMoreSaveMoreInstances) {
        window.buyMoreSaveMoreInstances = [];
      }
      window.buyMoreSaveMoreInstances.push(instance);
      
      return instance;
    }
  };
  
  // Auto-initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.buy-more-save-more');
    containers.forEach(container => {
      window.BuyMoreSaveMoreUtils.initContainer(container);
    });
  });
  
  // Handle dynamic content loading (for AJAX cart, quick view, etc.)
  document.addEventListener('shopify:section:load', () => {
    const containers = document.querySelectorAll('.buy-more-save-more:not(.bmsmInitialized)');
    containers.forEach(container => {
      window.BuyMoreSaveMoreUtils.initContainer(container);
    });
  });
  
  // Expose main class globally for advanced usage
  window.BuyMoreSaveMore = BuyMoreSaveMore;