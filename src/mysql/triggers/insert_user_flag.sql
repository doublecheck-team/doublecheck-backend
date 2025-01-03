DELIMITER $$

# user 신규 가입 시 flag 자동 생성

CREATE TRIGGER insert_user_flag
AFTER INSERT ON user
FOR EACH ROW
BEGIN
    INSERT INTO user_flag (key_user, type)
    VALUES
        (LAST_INSERT_ID(), 1),
        (LAST_INSERT_ID(), 2),
        (LAST_INSERT_ID(), 3),
        (LAST_INSERT_ID(), 4),
        (LAST_INSERT_ID(), 5);
END $$

DELIMITER ;
DELIMITER $$

# user 신규 가입 시 flag 자동 생성
CREATE TRIGGER insert_user_flag
AFTER INSERT ON user
FOR EACH ROW
BEGIN
    CALL insert_user_flag_data(LAST_INSERT_ID());
END$$

DELIMITER ;