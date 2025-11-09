import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <div style={{ fontFamily: "sans-serif", padding: "20px" }}>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/alipay" element={<Alipay />} />
          <Route path="/payment/processing" element={<PaymentProcessing />} />
          <Route path="/payment/return" element={<PaymentReturn />} />
        </Routes>
      </div>
    </Router>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: "20px" }}>
      <Link to="/">
        <button>Home</button>
      </Link>{" "}
      <Link to="/alipay">
        <button>Alipay</button>
      </Link>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  return (
    <div>
      <h1>Test Alipay Integration</h1>
      <p>A simple demo app with checkout and payment with Alipay through KICC PG, it is connected with all test accounts.</p>
      <button onClick={() => navigate("/alipay")}>Go to Checkout</button>
    </div>
  );
}

function Alipay() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([
    { id: 1, name: "Cultural Art Video - Kathak Dance", price: 50, quantity: 1 },
    { id: 2, name: "Traditional Music Collection", price: 30, quantity: 2 },
    { id: 3, name: "Folk Art Documentary", price: 75, quantity: 1 }
  ]);
  const [loading, setLoading] = useState(false);
  const [walletType, setWalletType] = useState("ALIPAY_CN");

  const updateQuantity = (id, delta) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handlePayment = async () => {
    setLoading(true);
    try {
      const orderNo = `ORD${Date.now()}`;
      const goodsNames = cartItems.map(item => item.name).join(", ");
      const goodsDetail = cartItems.map(item => `${item.name} x ${item.quantity}`).join(", ");

      const paymentData = {
        orderNo: orderNo,
        goodsName: goodsNames.substring(0, 50),
        goodsDetail: goodsDetail.substring(0, 100),
        returnUrl: `${window.location.origin}/payment/return`,
        notifyUrl: `${window.location.origin}/api/payment/notify`,
        currency: "USD",
        totalAmount: Math.round(total * 100),
        walletBrandName: walletType
      };

      const response = await fetch("/api/payment/alipay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.paymentUrl) {
          // Store payment URL and order number in sessionStorage
          sessionStorage.setItem("paymentUrl", result.paymentUrl);
          sessionStorage.setItem("orderNo", orderNo);
          // Navigate to processing page
          navigate("/payment/processing");
        } else {
          alert(`Payment initiated! Transaction ID: ${result.transactionId || 'N/A'}`);
        }
      } else {
        alert(`Payment failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error processing payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "10px"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Checkout</h2>
      
      {/* Cart Items */}
      <div style={{
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        padding: "15px",
        marginBottom: "20px"
      }}>
        <h3 style={{ marginTop: 0 }}>Cart Items</h3>
        
        {cartItems.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>Your cart is empty</p>
        ) : (
          cartItems.map(item => (
            <div key={item.id} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "15px 0",
              borderBottom: "1px solid #ddd"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>{item.name}</div>
                <div style={{ color: "#666", fontSize: "14px" }}>${item.price} each</div>
              </div>
              
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  style={{
                    width: "30px",
                    height: "30px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  -
                </button>
                <span style={{ minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  style={{
                    width: "30px",
                    height: "30px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    padding: "5px 10px",
                    border: "1px solid #ff4444",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    color: "#ff4444",
                    cursor: "pointer",
                    marginLeft: "10px"
                  }}
                >
                  Remove
                </button>
              </div>
              
              <div style={{
                minWidth: "80px",
                textAlign: "right",
                fontWeight: "bold",
                marginLeft: "15px"
              }}>
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Summary */}
      {cartItems.length > 0 && (
        <>
          <div style={{
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "20px"
          }}>
            <h3 style={{ marginTop: 0 }}>Order Summary</h3>
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: "1px solid #ddd"
            }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: "1px solid #ddd"
            }}>
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "15px 0",
              fontSize: "20px",
              fontWeight: "bold"
            }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Wallet Selection */}
          <div style={{
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "20px"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "15px" }}>Select Payment Wallet</h3>
            
            <select
              value={walletType}
              onChange={(e) => setWalletType(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              <option value="ALIPAY_CN">Alipay CN (China)</option>
              <option value="ALIPAY_HK">Alipay HK (Hong Kong)</option>
              <option value="CONNECT_WALLET">Connect Wallet</option>
              <option value="TRUEMONEY">TrueMoney (Thailand)</option>
              <option value="TNG">Touch 'n Go (Malaysia)</option>
              <option value="GCASH">GCash (Philippines)</option>
              <option value="DANA">DANA (Indonesia)</option>
              <option value="KAKAOPAY">KakaoPay (Korea)</option>
            </select>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              fontSize: "18px",
              fontWeight: "bold",
              color: "white",
              backgroundColor: loading ? "#999" : "#1677ff",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "10px"
            }}
          >
            {loading ? "Processing..." : `Pay with ${walletType.replace('_', ' ')} - $${total.toFixed(2)}`}
          </button>
          
          <p style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#666",
            margin: "10px 0"
          }}>
            Secure payment powered by Alipay+
          </p>
        </>
      )}
    </div>
  );
}

function PaymentProcessing() {
  const navigate = useNavigate();
  const [paymentUrl, setPaymentUrl] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [status, setStatus] = useState("redirecting");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    // Get payment URL from sessionStorage
    const url = sessionStorage.getItem("paymentUrl");
    const storedOrderNo = sessionStorage.getItem("orderNo");
    
    if (url && storedOrderNo) {
      setPaymentUrl(url);
      setOrderNo(storedOrderNo);
      
      // Redirect to Alipay after 2 seconds
      const timer = setTimeout(() => {
        setRedirected(true);
        setStatus("waiting");
        window.location.href = url;
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Poll payment status every 5 seconds after redirect
  useEffect(() => {
    if (!redirected || !orderNo) return;

    const checkPaymentStatus = async () => {
      if (checkingStatus) return;
      
      setCheckingStatus(true);
      try {
        console.log(`Checking payment status for order: ${orderNo}`);
        const response = await fetch(`/api/payment/status/${orderNo}`);
        const data = await response.json();
        
        console.log("Payment status:", data.status);

        if (response.ok) {
          if (data.status === "SUCCESS") {
            console.log("Payment successful, redirecting...");
            // Clear session storage
            sessionStorage.removeItem("paymentUrl");
            sessionStorage.removeItem("orderNo");
            // Redirect to return page
            navigate(`/payment/return?orderNo=${orderNo}`);
          } else if (data.status === "FAILED") {
            console.log("Payment failed, redirecting...");
            sessionStorage.removeItem("paymentUrl");
            sessionStorage.removeItem("orderNo");
            navigate(`/payment/return?orderNo=${orderNo}`);
          }
          // If PENDING, continue polling
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    // Start polling immediately
    checkPaymentStatus();

    // Then poll every 5 seconds
    const interval = setInterval(checkPaymentStatus, 5000);

    return () => clearInterval(interval);
  }, [redirected, orderNo, checkingStatus, navigate]);

  return (
    <div style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "40px 20px",
      textAlign: "center"
    }}>
      <div style={{
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        padding: "40px",
        marginBottom: "20px"
      }}>
        <div style={{
          width: "60px",
          height: "60px",
          border: "4px solid #1677ff",
          borderTopColor: "transparent",
          borderRadius: "50%",
          margin: "0 auto 20px",
          animation: "spin 1s linear infinite"
        }}></div>
        
        <h2 style={{ 
          color: "#1677ff",
          marginBottom: "15px"
        }}>
          {status === "redirecting" ? "Payment Processing" : "Waiting for Payment Confirmation"}
        </h2>
        
        <p style={{
          fontSize: "16px",
          color: "#666",
          marginBottom: "10px"
        }}>
          {status === "redirecting" 
            ? "Your payment is being processed at Alipay"
            : "Please complete your payment in the Alipay window"}
        </p>
        
        <p style={{
          fontSize: "14px",
          color: "#999"
        }}>
          {status === "redirecting"
            ? "You will be redirected to Alipay payment page shortly..."
            : "Checking payment status..."}
        </p>

        {orderNo && (
          <p style={{
            fontSize: "12px",
            color: "#999",
            marginTop: "20px"
          }}>
            Order: {orderNo}
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function PaymentReturn() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Verifying payment...");
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(window.location.search);
        const orderNo = params.get("orderNo");

        // Log all parameters for debugging
        console.log("Payment return parameters:", Object.fromEntries(params));
        console.log("Order number:", orderNo);
        console.log("Current URL:", window.location.href);

        if (!orderNo) {
          setStatus("failed");
          setMessage("No order number found in URL");
          setLoading(false);
          return;
        }

        // Call the status API using relative URL
        const apiUrl = `/api/payment/status/${orderNo}`;
        console.log("Calling API:", apiUrl);
        
        const response = await fetch(apiUrl);
        console.log("API Response status:", response.status);
        
        const data = await response.json();
        console.log("Payment status response:", data);

        if (response.ok) {
          setOrderDetails(data);
          
          // Determine payment status
          if (data.status === "SUCCESS") {
            setStatus("success");
            setMessage(`Payment successful!`);
          } else if (data.status === "FAILED") {
            setStatus("failed");
            setMessage(`Payment failed: ${data.resultMessage || "Unknown error"}`);
          } else if (data.status === "PENDING") {
            setStatus("pending");
            setMessage("Payment is still being processed. Please wait...");
          } else {
            setStatus("pending");
            setMessage("Payment status is being verified. Please check back later.");
          }
        } else {
          setStatus("failed");
          setMessage(`Error: ${data.message || data.error || "Unable to fetch payment status"}`);
        }
      } catch (error) {
        console.error("Error fetching payment status:", error);
        setStatus("failed");
        setMessage(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure the component is mounted
    const timer = setTimeout(() => {
      fetchPaymentStatus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "success": return "#52c41a";
      case "failed": return "#ff4d4f";
      default: return "#1677ff";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success": return "✓";
      case "failed": return "✗";
      default: return "⟳";
    }
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "40px 20px",
        textAlign: "center"
      }}>
        <div style={{
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          padding: "40px"
        }}>
          <div style={{
            width: "60px",
            height: "60px",
            border: "4px solid #1677ff",
            borderTopColor: "transparent",
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 1s linear infinite"
          }}></div>
          <p style={{ color: "#666" }}>Loading payment status...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "700px",
      margin: "0 auto",
      padding: "40px 20px",
      textAlign: "center"
    }}>
      <div style={{
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        padding: "40px",
        marginBottom: "20px"
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: getStatusColor(),
          color: "white",
          fontSize: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          fontWeight: "bold"
        }}>
          {getStatusIcon()}
        </div>
        
        <h2 style={{ 
          color: getStatusColor(),
          marginBottom: "15px"
        }}>
          {status === "success" ? "Payment Successful!" : 
           status === "failed" ? "Payment Failed" : 
           "Processing Payment"}
        </h2>
        
        <p style={{
          fontSize: "16px",
          color: "#666",
          marginBottom: "20px"
        }}>
          {message}
        </p>

        {/* Order Details */}
        {orderDetails && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            marginTop: "30px",
            textAlign: "left",
            border: "1px solid #e0e0e0"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#333" }}>Order Details</h3>
            
            <div style={{ marginBottom: "10px" }}>
              <strong>Order Number:</strong> {orderDetails.orderNo}
            </div>
            
            <div style={{ marginBottom: "10px" }}>
              <strong>Transaction ID:</strong> {orderDetails.shopTransactionId}
            </div>
            
            <div style={{ marginBottom: "10px" }}>
              <strong>PG Reference:</strong> {orderDetails.pgCno}
            </div>
            
            <div style={{ marginBottom: "10px" }}>
              <strong>Items:</strong> {orderDetails.goodsName}
            </div>
            
            <div style={{ marginBottom: "10px" }}>
              <strong>Details:</strong> {orderDetails.goodsDetail}
            </div>
            
            <div style={{ marginBottom: "10px" }}>
              <strong>Amount:</strong> {orderDetails.currency} {(orderDetails.totalAmount / 100).toFixed(2)}
            </div>

            <div style={{ marginBottom: "10px" }}>
              <strong>Status:</strong>{" "}
              <span style={{ 
                color: getStatusColor(),
                fontWeight: "bold"
              }}>
                {orderDetails.status}
              </span>
            </div>
            
            {orderDetails.createdAt && (
              <div style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
                <strong>Created:</strong> {new Date(orderDetails.createdAt).toLocaleString()}
              </div>
            )}
          </div>
        )}
        
        <div style={{ marginTop: "30px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "12px 30px",
              fontSize: "16px",
              color: "white",
              backgroundColor: "#1677ff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "10px"
            }}
          >
            Go to Home
          </button>
          
          {status === "failed" && (
            <button
              onClick={() => navigate("/alipay")}
              style={{
                padding: "12px 30px",
                fontSize: "16px",
                color: "#1677ff",
                backgroundColor: "white",
                border: "1px solid #1677ff",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}