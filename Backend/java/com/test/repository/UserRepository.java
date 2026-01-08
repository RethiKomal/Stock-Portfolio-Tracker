package com.test.repository;

import com.test.model.User;
import org.socialsignin.spring.data.dynamodb.repository.EnableScan;
import org.springframework.data.repository.CrudRepository;
import java.util.Optional;

@EnableScan
public interface UserRepository extends CrudRepository<User, String> {
    
    Optional<User> findByEmail(String email);
}
