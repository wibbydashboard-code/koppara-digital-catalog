
export const stripePromise = Promise.resolve({
  redirectToCheckout: async (options: any) => {
    console.log("Mock Stripe Redirect", options);
    return { error: null };
  }
});
