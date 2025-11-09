package com.example.payment.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.example.payment.dto.PaymentRequest;
import com.example.payment.dto.PaymentResponse;
import com.example.payment.entity.Payment;
import com.example.payment.repository.PaymentRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    private static final String ALIPAY_API_URL = "http://testpgapi.easypay.co.kr/api/trades/alipay";
    private static final String ALIPAY_FIND_API_URL = "http://testpgapi.easypay.co.kr/api/trades/alipay/find";
    private static final String MALL_ID = "T0001995";

    @Autowired
    private PaymentRepository paymentRepository;

    @PostMapping("/alipay")
    public ResponseEntity<?> processAlipayPayment(@RequestBody PaymentRequest paymentRequest) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("charset", "UTF-8");

            logger.info("Request Headers: {}", headers);

            // Generate transaction ID
            String shopTransactionId = UUID.randomUUID().toString().replace("-", "").substring(0, 10);

            // Prepare request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("mallId", MALL_ID);
            requestBody.put("shopTransactionId", shopTransactionId);
            requestBody.put("shopOrderNo", paymentRequest.getOrderNo());
            requestBody.put("goodsName", paymentRequest.getGoodsName());
            requestBody.put("goodsDetail", paymentRequest.getGoodsDetail());
            requestBody.put("returnUrl", paymentRequest.getReturnUrl() + "?orderNo=" + paymentRequest.getOrderNo());
            requestBody.put("notifyUrl", paymentRequest.getNotifyUrl());
            requestBody.put("walletBrandName", paymentRequest.getWalletBrandName() != null ? paymentRequest.getWalletBrandName() : "ALIPAY_CN");
            requestBody.put("terminalType", "WEB");

            Map<String, Object> amountInfo = new HashMap<>();
            amountInfo.put("currency", paymentRequest.getCurrency());
            amountInfo.put("totAmount", paymentRequest.getTotalAmount());
            requestBody.put("amountInfo", amountInfo);

            logger.info("Request Body: {}", requestBody);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // Make API call
            ResponseEntity<Map> response = restTemplate.exchange(
                ALIPAY_API_URL,
                HttpMethod.POST,
                entity,
                Map.class
            );

            logger.info("Response Status: {}", response.getStatusCode());
            logger.info("Response Body: {}", response.getBody());

            // Extract payment URL from response
            Map<String, Object> responseBody = response.getBody();
            Map<String, Object> result = new HashMap<>();
            
            if (responseBody != null && "0000".equals(responseBody.get("resCd"))) {
                // Create and save payment record
                Payment payment = new Payment();
                payment.setOrderNo(paymentRequest.getOrderNo());
                payment.setShopTransactionId(shopTransactionId);
                payment.setPgCno((String) responseBody.get("pgCno"));
                payment.setGoodsName(paymentRequest.getGoodsName());
                payment.setGoodsDetail(paymentRequest.getGoodsDetail());
                payment.setCurrency(paymentRequest.getCurrency());
                payment.setTotalAmount(paymentRequest.getTotalAmount().longValue());
                payment.setPaymentUrl((String) responseBody.get("paymentPageUrl"));
                payment.setWalletBrandName(paymentRequest.getWalletBrandName() != null ? paymentRequest.getWalletBrandName() : "ALIPAY_CN");
                payment.setStatus("PENDING");
                
                paymentRepository.save(payment);
                logger.info("Payment record saved: {}", payment.getOrderNo());

                result.put("success", true);
                result.put("paymentUrl", responseBody.get("paymentPageUrl"));
                result.put("normalUrl", responseBody.get("normalUrl"));
                result.put("transactionId", shopTransactionId);
                result.put("pgCno", responseBody.get("pgCno"));
            } else {
                result.put("success", false);
                result.put("error", responseBody != null ? responseBody.get("resMsg") : "Unknown error");
            }
            
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            logger.error("Payment processing failed", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Payment processing failed");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/notify")
    public ResponseEntity<?> handlePaymentNotification(@RequestBody Map<String, Object> notificationData) {
        logger.info("Payment notification received: {}", notificationData);
        
        try {
            String shopTransactionId = (String) notificationData.get("shopTransactionId");
            String resultCode = (String) notificationData.get("resCd");
            String resultMessage = (String) notificationData.get("resMsg");
            
            Payment payment = paymentRepository.findByShopTransactionId(shopTransactionId)
                .orElse(null);
            
            if (payment != null) {
                payment.setResultCode(resultCode);
                payment.setResultMessage(resultMessage);
                payment.setStatus("0000".equals(resultCode) ? "SUCCESS" : "FAILED");
                paymentRepository.save(payment);
                logger.info("Payment status updated: {} - {}", shopTransactionId, payment.getStatus());
            }
            
            return ResponseEntity.ok(Map.of("resCd", "0000", "resMsg", "OK"));
        } catch (Exception e) {
            logger.error("Error processing payment notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("resCd", "9999", "resMsg", "Error"));
        }
    }

    @GetMapping("/status/{orderNo}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable String orderNo) {
        logger.info("GET /api/payment/status/{} called", orderNo);
        try {
            // 1. Get payment data from database
            Payment payment = paymentRepository.findByOrderNo(orderNo)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderNo));

            logger.info("Found payment record for order: {}", orderNo);

            // 2. Call Alipay find API to get latest status
            RestTemplate restTemplate = new RestTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("charset", "UTF-8");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("mallId", MALL_ID);
            requestBody.put("shopTransactionId", payment.getShopTransactionId());
            requestBody.put("pgCno", payment.getPgCno());

            logger.info("Querying Alipay status - Request: {}", requestBody);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                ALIPAY_FIND_API_URL,
                HttpMethod.POST,
                entity,
                Map.class
            );

            logger.info("Alipay status response: {}", response.getBody());

            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody != null && "0000".equals(responseBody.get("resCd"))) {
                // Update payment record with latest information
                payment.setResultCode((String) responseBody.get("resCd"));
                payment.setResultMessage((String) responseBody.get("resMsg"));
                
                // Note: API returns "statusCd" not "statusCode"
                String statusCode = (String) responseBody.get("statusCd");
                if (statusCode != null) {
                    statusCode = statusCode.trim().replace(" ", "");
                    if ("TS01".equals(statusCode)) {
                        payment.setStatus("SUCCESS");
                    } else if ("TS00".equals(statusCode)) {
                        payment.setStatus("PENDING");
                    } else {
                        payment.setStatus("FAILED");
                    }
                    payment.setStatusCode(statusCode);
                }
                
                // Store approval date if available
                String approvalDate = (String) responseBody.get("approvalDate");
                if (approvalDate == null) {
                    approvalDate = (String) responseBody.get("approval Date"); // Handle space in key
                }
                if (approvalDate != null) {
                    payment.setApprovalDate(approvalDate);
                }
                
                // Store wallet brand name
                String walletBrandName = (String) responseBody.get("walletBrandName");
                if (walletBrandName != null) {
                    payment.setWalletBrandName(walletBrandName);
                }
                
                paymentRepository.save(payment);
                logger.info("Payment status updated: {} - {}", orderNo, payment.getStatus());
            }

            // 3. Return complete order details
            Map<String, Object> result = new HashMap<>();
            result.put("orderNo", payment.getOrderNo());
            result.put("shopTransactionId", payment.getShopTransactionId());
            result.put("pgCno", payment.getPgCno());
            result.put("goodsName", payment.getGoodsName());
            result.put("goodsDetail", payment.getGoodsDetail());
            result.put("currency", payment.getCurrency());
            result.put("totalAmount", payment.getTotalAmount());
            result.put("status", payment.getStatus());
            result.put("resultCode", payment.getResultCode());
            result.put("resultMessage", payment.getResultMessage());
            result.put("paymentUrl", payment.getPaymentUrl());
            result.put("createdAt", payment.getCreatedAt());
            result.put("updatedAt", payment.getUpdatedAt());
            
            // Include latest Alipay response
            result.put("alipayResponse", responseBody);

            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            logger.error("Payment not found: {}", orderNo, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Payment not found", "message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error fetching payment status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch payment status", "message", e.getMessage()));
        }
    }

    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        logger.info("Test endpoint called");
        return ResponseEntity.ok(Map.of("message", "API is working", "timestamp", System.currentTimeMillis()));
    }
}