package com.example.payment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.payment.entity.Payment;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderNo(String orderNo);
    Optional<Payment> findByShopTransactionId(String shopTransactionId);
    Optional<Payment> findByPgCno(String pgCno);
}
