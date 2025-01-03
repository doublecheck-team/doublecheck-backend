DELIMITER $$

CREATE PROCEDURE delete_expired_user_data()
BEGIN
    START TRANSACTION;

    SET FOREIGN_KEY_CHECKS = 0;

    SET @expired_users = (SELECT key_user FROM user_drop WHERE exp_date < NOW());

    DELETE FROM alarm_user WHERE key_user IN (@expired_users);
    DELETE FROM user WHERE key_user IN (@expired_users);
    DELETE FROM user_flag WHERE key_user IN (@expired_users);
    DELETE FROM verification WHERE key_user IN (@expired_users);

    SET FOREIGN_KEY_CHECKS = 1;

    COMMIT;
END$$

DELIMITER ;