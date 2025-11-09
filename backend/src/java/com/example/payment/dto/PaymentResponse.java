package com.example.payment.dto;

public class PaymentResponse {
    private String transactionId;
    private String status;
    private String paymentUrl;
    private String message;

    public PaymentResponse() {}

    // Getters and Setters
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPaymentUrl() { return paymentUrl; }
    public void setPaymentUrl(String paymentUrl) { this.paymentUrl = paymentUrl; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}