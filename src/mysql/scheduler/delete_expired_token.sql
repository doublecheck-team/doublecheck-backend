DELIMITER $$

# 만료된 토큰 데이터 삭제
CREATE EVENT delete_expired_token
ON SCHEDULE EVERY 1 DAY
STARTS '2025-01-03 02:00:00'
DO
    CALL delete_expired_token_data();
$$

DELIMITER $$;