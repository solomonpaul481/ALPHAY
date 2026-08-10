async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || data.message || "Something went wrong.");
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export function createApiClient(restaurantId) {
  const base = `/api/r/${restaurantId}`;
  return {
    getInfo: () => request(`${base}/info`),
    checkSession: (tableNumber) =>
      request(`${base}/session/check`, { method: "POST", body: JSON.stringify({ tableNumber }) }),
    startSession: (payload) =>
      request(`${base}/session`, { method: "POST", body: JSON.stringify(payload) }),
    getActiveSession: () => request(`${base}/session/active`),
    requestBill: () => request(`${base}/session/request-bill`, { method: "POST" }),
    paySessionOnline: () => request(`${base}/session/pay-online`, { method: "POST" }),
    verifySessionPayment: (payload) =>
      request(`${base}/session/verify-payment`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    paySessionCash: () => request(`${base}/session/pay-cash`, { method: "POST" }),
    getMenu: () => request(`${base}/menu`),
    createOrder: (payload) =>
      request(`${base}/orders`, { method: "POST", body: JSON.stringify(payload) }),
    getOrder: (orderId) => request(`${base}/orders/${orderId}`),
    verifyPayment: (orderId, payload) =>
      request(`${base}/orders/${orderId}/verify`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    payCash: (orderId) =>
      request(`${base}/orders/${orderId}/cash`, {
        method: "POST",
      }),
    cancelOrder: (orderId) => request(`${base}/orders/${orderId}/cancel`, { method: "POST" }),
    callStaff: (type) =>
      request(`${base}/staff-call`, { method: "POST", body: JSON.stringify({ type }) }),
    submitRating: (orderId, payload) =>
      request(`${base}/orders/${orderId}/rating`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };
}
