DELIMITER $$

## 탈퇴자 데이터 보존 만료 기간 이후 삭제
CREATE EVENT drop_user_data_delete
ON SCHEDULE EVERY 1 DAY
STARTS '2025-01-03 02:00:00'
DO
    CALL delete_expired_user_data();
$$
DELIMITER ;