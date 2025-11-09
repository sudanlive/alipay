package com.example.payment.dto;

public class PaymentRequest {
    private String orderNo;
    private String goodsName;
    private String goodsDetail;
    private String returnUrl;
    private String notifyUrl;
    private String currency;
    private Integer totalAmount;

    public PaymentRequest() {}

    // Getters and Setters
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }

    public String getGoodsName() { return goodsName; }
    public void setGoodsName(String goodsName) { this.goodsName = goodsName; }

    public String getGoodsDetail() { return goodsDetail; }
    public void setGoodsDetail(String goodsDetail) { this.goodsDetail = goodsDetail; }

    public String getReturnUrl() { return returnUrl; }
    public void setReturnUrl(String returnUrl) { this.returnUrl = returnUrl; }

    public String getNotifyUrl() { return notifyUrl; }
    public void setNotifyUrl(String notifyUrl) { this.notifyUrl = notifyUrl; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Integer getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Integer totalAmount) { this.totalAmount = totalAmount; }
}