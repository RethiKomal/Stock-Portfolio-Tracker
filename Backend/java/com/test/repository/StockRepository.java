package com.test.repository;

import com.test.model.Stock;
import org.socialsignin.spring.data.dynamodb.repository.EnableScan;
import org.springframework.data.repository.CrudRepository;
import java.util.List;

@EnableScan
public interface StockRepository extends CrudRepository<Stock, String> {
    
    List<Stock> findByUserId(String userId);
}
