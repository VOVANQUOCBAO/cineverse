-- =====================================================================
--  CINEVERSE — Dữ liệu mẫu (seed)  | chạy SAU 01_schema.sql
--  Nguồn: data.js / admin-data.js của web. Mã định danh giữ khớp:
--  movie_id = số trong "mN", cinema_id = "cN", customer_id = "uN", staff_id = "stN".
--  Mật khẩu mẫu (mọi tài khoản): 123456.
-- =====================================================================
USE cineverse;

SET @PW := '$2a$10$CF4MW7qOcx.lm7ro7Zv9Z.tPIA/Bwb534fbDRPz8HKv7EJXeQbahC';

-- ---------------------------------------------------------------------
-- DANH MỤC
-- ---------------------------------------------------------------------
INSERT INTO membership_tiers (tier_id, code, name, min_points, discount_rate) VALUES
 (1,'bronze','Bronze',0,0.000),
 (2,'silver','Silver',200,0.030),
 (3,'gold','Gold',500,0.050),
 (4,'platinum','Platinum',1000,0.080);

INSERT INTO seat_types (seat_type_id, code, name, default_price) VALUES
 (1,'regular','Ghế thường',75000),
 (2,'vip','Ghế VIP',110000),
 (3,'couple','Ghế đôi',220000);

INSERT INTO formats (format_id, code, name) VALUES
 (1,'2D','2D'),
 (2,'3D','3D'),
 (3,'IMAX','IMAX');

INSERT INTO genres (genre_id, name) VALUES
 (1,'Khoa học viễn tưởng'),(2,'Hành động'),(3,'Tâm lý'),(4,'Tiểu sử'),
 (5,'Lịch sử'),(6,'Kịch tính'),(7,'Phiêu lưu'),(8,'Gián điệp'),
 (9,'Giật gân'),(10,'Kinh dị'),(11,'Hoạt hình'),(12,'Lãng mạn'),
 (13,'Kỳ ảo'),(14,'Gia đình'),(15,'Sử thi'),(16,'Siêu anh hùng');

INSERT INTO actors (actor_id, full_name) VALUES
 (1,'Leonardo DiCaprio'),(2,'Joseph Gordon-Levitt'),(3,'Elliot Page'),(4,'Tom Hardy'),
 (5,'Cillian Murphy'),(6,'Emily Blunt'),(7,'Matt Damon'),(8,'Robert Downey Jr.'),(9,'Florence Pugh'),
 (10,'Sam Worthington'),(11,'Zoe Saldana'),(12,'Sigourney Weaver'),(13,'Stephen Lang'),
 (14,'Ryan Gosling'),(15,'Sandra Hüller'),
 (16,'Tom Cruise'),(17,'Rebecca Ferguson'),(18,'Hayley Atwell'),(19,'Simon Pegg'),(20,'Ving Rhames'),
 (21,'Pedro Pascal'),(22,'Bella Ramsey'),(23,'Anna Torv'),
 (24,'(Lồng tiếng) Natsuki Hanae'),(25,'Akari Kitō'),(26,'Yoshitsugu Matsuoka'),
 (27,'(Lồng tiếng) Kotaro Daigo'),(28,'Nana Mori'),(29,'Kate Winslet'),
 (30,'Matthew McConaughey'),(31,'Anne Hathaway'),(32,'Jessica Chastain'),(33,'Michael Caine'),
 (34,'Kristen Wiig'),(35,'Jeff Daniels'),
 (36,'Timothée Chalamet'),(37,'Zendaya'),(38,'Josh Brolin'),
 (39,'(Lồng tiếng) Edward Asner'),(40,'Jordan Nagai'),(41,'Bob Peterson'),
 (42,'Tom Holland'),(43,'Lupita Nyong''o'),(44,'Kengo Kawanishi'),
 (45,'(Lồng tiếng) Ryunosuke Kamiki'),(46,'Mone Kamishiraishi'),
 (47,'Park Ji-hu'),(48,'Yoon Chan-young'),(49,'Cho Yi-hyun'),(50,'Park Solomon'),
 (51,'Jake Weary'),(52,'Ana de la Reguera'),(53,'Lance Reddick'),
 (54,'Dylan O''Brien'),(55,'Kaya Scodelario'),(56,'Thomas Brodie-Sangster'),(57,'Will Poulter'),
 (58,'Jennifer Lawrence'),(59,'Chris Pratt'),(60,'Michael Sheen'),(61,'Laurence Fishburne'),
 (62,'Dwayne Johnson'),(63,'Juno Temple'),
 (64,'John Boyega'),(65,'Michael B. Jordan'),(66,'Viola Davis'),(67,'Winston Duke'),
 (68,'Keanu Reeves'),(69,'Gal Gadot'),(70,'Yahya Abdul-Mateen II'),
 (71,'Josh Hutcherson'),(72,'Jonah Bobo'),(73,'Kristen Stewart'),
 (74,'Millie Bobby Brown'),(75,'Lily James'),(76,'Idina Menzel'),(77,'Ryan Reynolds'),
 (78,'John C. Reilly'),(79,'Gary Oldman');

-- ---------------------------------------------------------------------
-- PHIM (25 phim) — movie_id khớp "mN"
-- ---------------------------------------------------------------------
INSERT INTO movies
 (movie_id,title,title_en,duration_min,age_rating,imdb_score,votes,director,country,status,release_date,synopsis,poster_url,trailer_key,theme_dark,theme_light,accent_color) VALUES
 (1,'Inception','Inception',148,'T16',8.8,24560,'Christopher Nolan','Mỹ / Anh','now','2026-05-15','Dom Cobb — kẻ trộm tài ba nhất trong thế giới đặc biệt: xâm nhập vào giấc mơ của người khác để đánh cắp bí mật từ tiềm thức. Nhưng nhiệm vụ lần này không phải đánh cắp — mà là cài cắm một ý tưởng.','posters/inception.png','YoHD9XEInc0','#050a14','#0d1c30','#6ea8f0'),
 (2,'Oppenheimer','Oppenheimer',180,'T18',8.7,18920,'Christopher Nolan','Mỹ / Anh','now','2026-05-10','Cuộc đời J. Robert Oppenheimer — thiên tài vật lý dẫn đầu Dự án Manhattan tạo ra bom nguyên tử, và những hệ quả đạo đức ám ảnh ông đến cuối đời.','posters/oppenheimer.png','q6JTfzbxczU','#0e0d0c','#1a1810','#c8b060'),
 (3,'Avatar: Lửa & Tro Tàn','Avatar: Fire and Ash',150,'T13',8.2,12840,'James Cameron','Mỹ','now','2026-05-22','Jake Sully và Neytiri phải bảo vệ gia đình trước một mối đe dọa mới xuất phát từ lòng núi lửa của Pandora — nơi tộc người Ash''atkan, những kẻ sống giữa lửa và tro, đang trỗi dậy.','posters/avatar-fire-ash.png','nb_fFj_0rq8','#0a1a10','#143020','#40d090'),
 (4,'Project Hail Mary','Project Hail Mary',138,'T13',8.5,9340,'Phil Lord & Christopher Miller','Mỹ','now','2026-05-29','Một giáo viên khoa học tỉnh dậy trong con tàu vũ trụ cô độc giữa vũ trụ, mất hết ký ức. Sứ mệnh duy nhất của anh: cứu lấy Trái Đất. Và người đồng hành của anh không phải con người.','posters/project-hail-mary.webp','P0XN3-n-2Lo','#04060e','#080e28','#ff7040'),
 (5,'Mission: Impossible – Eternity Protocol','Mission: Impossible – Eternity Protocol',163,'T16',8.0,15600,'Christopher McQuarrie','Mỹ','now','2026-05-08','Ethan Hunt đối mặt với kẻ thù nguy hiểm nhất từ trước đến nay — một AI có khả năng tiếp quản toàn bộ hệ thống vũ khí hạt nhân thế giới trong vòng 72 giờ.','posters/mission-impossible.webp','MtrMxywpuLU','#080606','#160808','#e03030'),
 (6,'The Last of Us','The Last of Us',135,'T18',8.9,21450,'Craig Mazin & Neil Druckmann','Mỹ','now','2026-05-25','Trong thế giới hậu tận thế bị nấm Cordyceps tàn phá, người đàn ông chai lì tên Joel phải hộ tống cô bé Ellie — người có thể là chìa khóa cho vaccine cứu nhân loại — vượt qua nước Mỹ hoang tàn.','posters/the-last-of-us.png','uLtkt8BonwM','#060e08','#0e2010','#60c050'),
 (7,'Demon Slayer: Lâu Đài Vô Tận','Demon Slayer: Infinity Castle',120,'T16',9.0,30200,'Haruo Sotozaki','Nhật Bản','now','2026-05-23','Tanjiro và đồng đội tiến vào Lâu Đài Vô Tận — pháo đài bất khả xâm phạm của Muzan Kibutsuji — cho trận chiến sinh tử cuối cùng giữa Diệt Quỷ Đội và 12 Nguyệt.','posters/demon-slayer-infinite.png','9kb7vK11_Rw','#140608','#2e0a08','#e05020'),
 (8,'Weathering With You','Weathering With You',112,'T13',8.4,11200,'Makoto Shinkai','Nhật Bản','now','2026-05-20','Hodaka bỏ trốn lên Tokyo và gặp Hina — cô gái có khả năng xua đuổi mưa. Giữa thành phố ngập lụt, tình yêu của họ phải đối mặt với lựa chọn: cứu thế giới hay cứu lấy nhau.','posters/weathering-with-you.png','Q6iK6DjV_iE','#081428','#0e2844','#60c0f0'),
 (9,'Avatar: Dòng Chảy Của Nước','Avatar: The Way of Water',192,'T13',7.9,0,'James Cameron','Mỹ','now','2026-06-12','Jake Sully và gia đình phải rời bỏ quê hương, khám phá vùng biển kỳ diệu của Pandora và tộc người Metkayina để chiến đấu chống lại mối đe dọa diệt vong.','posters/avatar-way-of-water.png','d9MyW72ELq0','#020c18','#083050','#30b8f0'),
 (10,'Interstellar','Interstellar',169,'T13',8.7,0,'Christopher Nolan','Mỹ / Anh','now','2026-06-19','Khi Trái Đất dần chết đi vì bão bụi, một nhóm phi hành gia dũng cảm vượt qua lỗ sâu đục không-thời gian để tìm kiếm hành tinh mới cho nhân loại. Nhưng thứ vũ khí mạnh nhất họ mang theo chính là tình yêu.','posters/interstellar.png','zSWdZVtXT7E','#040810','#080e20','#90b8e8'),
 (11,'The Martian','The Martian',144,'T13',8.0,0,'Ridley Scott','Mỹ','now','2026-06-26','Bị bỏ lại một mình trên Sao Hỏa sau một cơn bão, nhà du hành Mark Watney phải dùng khoa học, sự khéo léo và tinh thần bất khuất để sinh tồn — và tìm cách về nhà.','posters/the-martian.png','ej3ioOneTy8','#1a0a02','#400e04','#e87040'),
 (12,'Dune 3: Thánh Chiến','Dune: The Holy War',160,'T16',0,0,'Denis Villeneuve','Mỹ','now','2026-07-03','Paul Atreides dẫn đầu cuộc Thánh Chiến vũ trụ, nhưng quyền năng ngày càng lớn khiến anh không còn chắc mình đang chiến đấu vì con người hay vì số phận mà anh luôn cố thoát khỏi.','posters/dune-3.png','U2Qp5pL3ovA','#180e04','#402204','#d09030'),
 (13,'Up 2: Cuộc Phiêu Lưu Trên Mây','Up 2: Adventure Above',98,'P',0,0,'Pete Docter','Mỹ','now','2026-07-10','Carl Fredricksen và Russell trở lại với chuyến phiêu lưu mới — lần này tới những hòn đảo nổi huyền bí trên tầng mây, nơi cất giữ bí mật cuối cùng của Ellie.','posters/up-2.png','ORFWdXl_zJ4','#081428','#102040','#f09040'),
 (14,'The Odyssey','The Odyssey',155,'T13',0,0,'Christopher Nolan','Mỹ / Anh','now','2026-07-17','Dựa trên sử thi của Homer: Odysseus — vua Ithaca, chiến binh huyền thoại — bắt đầu hành trình 10 năm vượt qua quái vật, phù thủy và cơn thịnh nộ của thần linh để trở về bên gia đình.','posters/the-odyssey.webp','iklicVKcoI8','#080808','#141428','#c0a050'),
 (15,'Demon Slayer: Làng Thợ Rèn','Demon Slayer: Swordsmith Village',110,'T13',0,0,'Haruo Sotozaki','Nhật Bản','now','2026-07-24','Tanjiro tới Làng Thợ Rèn để sửa thanh kiếm Nhật Thần — và chạm mặt hai Thượng Huyền Nhất cùng lúc. Mỗi giây sống sót là một kỳ tích.','posters/demon-slayer-swordsmith.png','PUeB0qbisq0','#080c18','#0a1438','#60a8e0'),
 (16,'Your Name','Your Name.',106,'T13',8.4,0,'Makoto Shinkai','Nhật Bản','now','2026-08-01','Mitsuha — cô gái miền núi — và Taki — chàng trai Tokyo — bỗng dưng đổi thân xác cho nhau mỗi đêm. Khi sợi chỉ đỏ đứt gãy giữa hai chiều thời gian, chỉ còn ký ức mờ nhạt dẫn đường.','posters/your-name.png','xU47nhruN-Q','#080c18','#101830','#a080f0'),
 (17,'All of Us Are Dead','All of Us Are Dead',135,'T18',7.8,9200,'Lee Jae-kyoo','Hàn Quốc','now','2026-05-18','Một ngôi trường bỗng trở thành ổ dịch zombie. Nhóm học sinh bị mắc kẹt bên trong phải chiến đấu sinh tồn — trong khi thế giới bên ngoài dần sụp đổ và hy vọng ngày càng mỏng manh.','posters/all-of-us-are-dead.png','IN5TD4VRcSM','#080e06','#0e1a08','#60c040'),
 (18,'The Last Infection','The Last Infection',108,'T18',6.8,4100,'Matteo Romano','Mỹ','now','2026-05-30','Dịch bệnh bùng phát toàn cầu. Một nhóm người sống sót cuối cùng phải vượt qua thành phố đổ nát để tìm đến cơ sở nghiên cứu duy nhất còn hoạt động — nơi có thể chứa vaccine cứu nhân loại.','posters/the-last-infection.png','5wZeuNpIEk4','#1a0806','#380e04','#e04020'),
 (19,'The Maze Runner','The Maze Runner',113,'T13',7.3,7800,'Wes Ball','Mỹ','now','2026-05-12','Thomas tỉnh dậy trong một mê cung khổng lồ mà không nhớ gì về bản thân. Cùng nhóm thiếu niên bị mắc kẹt, anh phải tìm đường thoát khỏi mê cung chết chóc trước khi đêm xuống.','posters/maze-runner.png','AwwbhhjQ9Xk','#0a0e08','#101808','#80b040'),
 (20,'Passengers','Passengers',116,'T13',7.0,5600,'Morten Tyldum','Mỹ','now','2026-06-28','Trên chuyến tàu vũ trụ chở 5.000 hành khách đến hành tinh mới, hai người tình cờ thức dậy sớm 90 năm. Giữa vũ trụ bao la, họ phải đối mặt với câu hỏi: đây là vận mệnh hay tai họa?','posters/passengers.png','5r2BpNCHdkE','#040812','#080e28','#5090e0'),
 (21,'Venom 4: King in Black','Venom 4: King in Black',128,'T13',7.2,6500,'Andy Serkis','Mỹ','now','2026-06-20','Venom và Spider-Man buộc phải liên minh khi Knull — Vua Bóng Tối nguyên thủy — trỗi dậy với đội quân Symbiote đe dọa nuốt chửng toàn bộ Trái Đất trong bóng tối vĩnh cửu.','posters/venom-4.png','fFdpKZ2nugU','#08080e','#100818','#8840e0'),
 (22,'Mosi: The First Black Panther','Mosi: The First Black Panther',145,'T13',0,0,'Ryan Coogler','Mỹ','coming','2026-07-15','Nguồn gốc của Black Panther đầu tiên — Mosi — chiến binh huyền thoại đã ký kết giao ước với thần Bast hàng nghìn năm trước, khai sinh ra di sản bảo vệ Wakanda đến tận ngày nay.','posters/mosi-black-panther.png','DxL2HoqLbyA','#0a0806','#201004','#e09020'),
 (23,'Speed 3: Ranh Giới Tử Thần','Speed 3',110,'T16',0,0,'Chad Stahelski','Mỹ','coming','2026-07-25','Một đoàn tàu cao tốc chở 800 hành khách bị gài bom: nếu tốc độ giảm dưới 200 km/h — tất cả sẽ nổ tung. Jack Traven trở lại để phá vòng vây của tên khủng bố điên loạn nhất lịch sử.','posters/speed-3.png','qEVUtrk8_B4','#0a0808','#1e0808','#e05020'),
 (24,'Zathura 2: Galactic Drift','Zathura 2: Galactic Drift',114,'T13',0,0,'Jon Favreau','Mỹ','coming','2026-08-07','Trò chơi Zathura xuất hiện trở lại — lần này đưa ba anh chị em vào hành trình xuyên thiên hà với những nền văn minh xa lạ, quái vật vũ trụ, và bí ẩn về nguồn gốc của trò chơi kỳ lạ.','posters/zathura-2.png','zNxm_obDpNU','#040810','#081430','#4090f0'),
 (25,'The Wizard of Oz','The Wizard of Oz',132,'T13',0,0,'Robert Zemeckis','Mỹ','coming','2026-08-14','Dorothy bị cuốn vào xứ Oz thần kỳ sau cơn lốc xoáy. Trên con đường gạch vàng, cô cùng bộ ba người bạn kỳ lạ tìm đến Phù Thủy Vĩ Đại — nhưng con đường trở về nhà không hề đơn giản.','posters/wizard-of-oz.png','VdCgdKLpfvs','#101008','#282008','#d0a020');

-- PHIM ↔ THỂ LOẠI
INSERT INTO movie_genres (movie_id, genre_id) VALUES
 (1,1),(1,2),(1,3), (2,4),(2,5),(2,6), (3,1),(3,7),(3,2), (4,1),(4,7),
 (5,2),(5,8),(5,9), (6,10),(6,7),(6,6), (7,11),(7,2),(7,10), (8,11),(8,12),(8,13),
 (9,1),(9,7), (10,1),(10,7),(10,6), (11,1),(11,7), (12,1),(12,15),(12,2),
 (13,11),(13,7),(13,14), (14,15),(14,7),(14,2), (15,11),(15,2), (16,11),(16,12),(16,13),
 (17,10),(17,2),(17,6), (18,10),(18,2),(18,9), (19,1),(19,2),(19,9), (20,1),(20,12),(20,6),
 (21,2),(21,1),(21,16), (22,2),(22,15),(22,16), (23,2),(23,9), (24,7),(24,14),(24,1),
 (25,13),(25,7),(25,14);

-- PHIM ↔ ĐỊNH DẠNG
INSERT INTO movie_formats (movie_id, format_id) VALUES
 (1,1),(1,3), (2,1),(2,3), (3,1),(3,2),(3,3), (4,1),(4,3), (5,1),(5,3),
 (6,1), (7,1),(7,3), (8,1), (9,1),(9,2),(9,3), (10,1),(10,3), (11,1),(11,3),
 (12,1),(12,3), (13,1),(13,2), (14,1),(14,3), (15,1), (16,1), (17,1), (18,1),
 (19,1), (20,1),(20,3), (21,1),(21,3), (22,1),(22,3), (23,1),(23,3), (24,1),(24,2),
 (25,1),(25,2),(25,3);

-- PHIM ↔ DIỄN VIÊN
INSERT INTO movie_actors (movie_id, actor_id) VALUES
 (1,1),(1,2),(1,3),(1,4),
 (2,5),(2,6),(2,7),(2,8),(2,9),
 (3,10),(3,11),(3,12),(3,13),
 (4,14),(4,15),
 (5,16),(5,17),(5,18),(5,19),(5,20),
 (6,21),(6,22),(6,23),
 (7,24),(7,25),(7,26),
 (8,27),(8,28),
 (9,10),(9,11),(9,12),(9,29),
 (10,30),(10,31),(10,32),(10,33),
 (11,7),(11,32),(11,34),(11,35),
 (12,36),(12,37),(12,17),(12,38),
 (13,39),(13,40),(13,41),
 (14,7),(14,31),(14,42),(14,37),(14,43),
 (15,24),(15,26),(15,44),
 (16,45),(16,46),
 (17,47),(17,48),(17,49),(17,50),
 (18,51),(18,52),(18,53),
 (19,54),(19,55),(19,56),(19,57),
 (20,58),(20,59),(20,60),(20,61),
 (21,4),(21,42),(21,62),(21,63),
 (22,64),(22,65),(22,66),(22,67),
 (23,68),(23,69),(23,70),
 (24,71),(24,72),(24,73),
 (25,74),(25,75),(25,76),(25,77),(25,78),(25,79);

-- ---------------------------------------------------------------------
-- RẠP & PHÒNG
-- ---------------------------------------------------------------------
INSERT INTO cinemas (cinema_id, name, city, address) VALUES
 (1,'CineVerse Nguyễn Trãi','TP. Hồ Chí Minh','92 Nguyễn Trãi, Quận 1'),
 (2,'CineVerse Hai Bà Trưng','TP. Hồ Chí Minh','135 Hai Bà Trưng, Quận 3'),
 (3,'CineVerse Landmark 81','TP. Hồ Chí Minh','Vinhomes Central Park, Bình Thạnh'),
 (4,'CineVerse Hà Nội Center','Hà Nội','Tràng Tiền Plaza, Hoàn Kiếm');

INSERT INTO rooms (room_id, cinema_id, name, room_type) VALUES
 (1,1,'Phòng 01','2D'),
 (2,1,'Phòng IMAX','IMAX'),
 (3,2,'Phòng 03','2D'),
 (4,3,'Phòng Gold Class','3D'),
 (5,4,'Phòng 02','2D');

-- ---------------------------------------------------------------------
-- KHÁCH HÀNG (uN)  &  NHÂN VIÊN (stN)
-- ---------------------------------------------------------------------
INSERT INTO customers (customer_id, full_name, email, phone, password_hash, avatar_color, tier_id, points, joined_date, last_visit) VALUES
 (1,'Nguyễn Văn An','an.nguyen@email.com','0901 234 567',@PW,'#f6c445',2,280,'2024-01-15','2026-05-30'),
 (2,'Trần Thị Bích','bich.tran@email.com','0902 345 678',@PW,'#6D28D9',3,620,'2023-08-20','2026-06-01'),
 (3,'Lê Hoàng Nam','nam.le@email.com','0903 456 789',@PW,'#C2410C',1,140,'2024-06-10','2026-05-18'),
 (4,'Phạm Ngọc Hà','ha.pham@email.com','0904 567 890',@PW,'#0D9488',1,60,'2025-02-28','2026-05-25'),
 (5,'Vũ Minh Châu','chau.vu@email.com','0905 678 901',@PW,'#9D3A8C',4,1050,'2023-03-14','2026-06-02'),
 (6,'Đặng Quốc Bảo','bao.dang@email.com','0906 789 012',@PW,'#3B5BA9',2,210,'2024-11-01','2026-05-29'),
 (7,'Hồ Thanh Tuyền','tuyen.ho@email.com','0907 890 123',@PW,'#7F1D1D',1,30,'2025-05-15','2026-05-22'),
 (8,'Ngô Thị Diệu','dieu.ngo@email.com','0908 901 234',@PW,'#065F46',3,440,'2023-12-20','2026-06-01'),
 (9,'Đinh Công Toàn','toan.dinh@email.com','0909 012 345',@PW,'#1a3a6a',2,230,'2024-07-08','2026-05-27'),
 (10,'Lương Thị Phương','phuong.luong@email.com','0910 123 456',@PW,'#6b2fa0',4,1840,'2022-10-30','2026-06-03'),
 (11,'Tạ Văn Hùng','hung.ta@email.com','0911 234 567',@PW,'#b45309',1,80,'2025-03-22','2026-05-15'),
 (12,'Cao Thị Linh','linh.cao@email.com','0912 345 678',@PW,'#047857',2,360,'2024-04-04','2026-06-02');

INSERT INTO staff (staff_id, full_name, email, phone, password_hash, role, position, cinema_id, hire_date, status, salary, avatar_color) VALUES
 (1,'Trần Thị Lan','lan.tran@cineverse.vn','0912 345 678',@PW,'staff','Nhân viên bán vé',1,'2024-03-15','active',8500000,'#38d39f'),
 (2,'Lê Văn Bình','binh.le@cineverse.vn','0923 456 789',@PW,'staff','Nhân viên soát vé',1,'2023-11-20','active',8000000,'#6ea8ff'),
 (3,'Phạm Thị Hoa','hoa.pham@cineverse.vn','0934 567 890',@PW,'manager','Quản lý rạp',2,'2022-06-01','active',18000000,'#a78bfa'),
 (4,'Nguyễn Minh Tuấn','tuan.nguyen@cineverse.vn','0945 678 901',@PW,'staff','Nhân viên bán vé',3,'2025-01-10','active',8500000,'#f59e42'),
 (5,'Đỗ Thị Mai','mai.do@cineverse.vn','0956 789 012',@PW,'staff','Nhân viên phục vụ',2,'2024-09-05','inactive',7500000,'#f87171'),
 (6,'Vũ Hoàng Long','long.vu@cineverse.vn','0967 890 123',@PW,'staff','Kỹ thuật viên chiếu phim',1,'2023-04-18','active',11000000,'#60c0f0'),
 (7,'Bùi Thị Yến','yen.bui@cineverse.vn','0978 901 234',@PW,'manager','Quản lý rạp',4,'2021-09-01','active',20000000,'#fbbf24'),
 (8,'Hoàng Văn Đức','duc.hoang@cineverse.vn','0989 012 345',@PW,'admin','Quản trị hệ thống',NULL,'2021-01-05','active',35000000,'#ff5a5f');

-- ---------------------------------------------------------------------
-- BẮP NƯỚC (concessions)
-- ---------------------------------------------------------------------
INSERT INTO concessions (concession_id, name, category, price, is_active) VALUES
 (1,'Bắp ngọt (vừa)','bắp',45000,1),
 (2,'Bắp phô mai (lớn)','bắp',65000,1),
 (3,'Nước ngọt Coca (vừa)','nước',30000,1),
 (4,'Combo 1 — 1 Bắp + 1 Nước','combo',89000,1),
 (5,'Combo 2 — 1 Bắp + 2 Nước','combo',109000,1),
 (6,'Combo Couple — 1 Bắp lớn + 2 Nước','combo',129000,1),
 (7,'Snack khoai tây','snack',35000,1),
 (8,'Nước suối Aquafina','nước',20000,1);

-- ---------------------------------------------------------------------
-- ĐÁNH GIÁ (reviews) — customer_id để NULL, lưu tên người đánh giá
-- ---------------------------------------------------------------------
INSERT INTO reviews (movie_id, customer_id, reviewer_name, avatar_color, rating, review_text, is_verified, created_date) VALUES
 (1,NULL,'Hoàng Minh','#3B5BA9',5,'IMAX thật sự đáng đồng tiền. Cảnh giấc mơ trong giấc mơ quay lại rạp lần thứ 3 vẫn choáng.',1,'2026-05-30'),
 (1,NULL,'Lan Anh','#6D28D9',5,'Phim hay nhất mình từng xem. Mỗi lần coi lại phát hiện thêm chi tiết mới.',1,'2026-05-28'),
 (2,NULL,'Đức Anh','#1a1810',5,'Cillian Murphy diễn xuất phi thường. 3 tiếng không hề thấy buồn ngủ — một kỳ tích của Nolan.',1,'2026-05-25'),
 (2,NULL,'Bảo Châu','#4a3820',4,'Nặng và chậm ở đầu nhưng càng về sau càng cuốn. Cần xem IMAX mới thấm hết.',0,'2026-05-24'),
 (3,NULL,'Tuấn Kiệt','#143020',5,'Pandora mùa lửa đẹp đến mức không tin nổi. 3D IMAX xứng đáng từng đồng.',1,'2026-05-22'),
 (4,NULL,'Phương Linh','#080818',5,'Rocky — người bạn đồng hành alien — sẽ là nhân vật hoạt hình được yêu thích nhất năm nay. Mình khóc mà không biết tại sao.',1,'2026-05-30'),
 (5,NULL,'Quốc Huy','#160808',4,'Cảnh đuổi xe ở London đỉnh hơn mọi phim hành động 5 năm gần đây. Tom Cruise vẫn tự làm stunt ở tuổi này.',1,'2026-05-20'),
 (6,NULL,'Hà Vy','#0e2010',5,'Pedro Pascal và Bella Ramsey — chemistry của họ chân thật đến mức đau lòng. Không phải phim game thông thường.',1,'2026-05-26'),
 (7,NULL,'Thiên An','#2e0a08',5,'Lâu Đài Vô Tận đẹp đến mức thở không ra hơi. Trận đấu của Rengoku làm cả rạp hò reo.',1,'2026-05-28'),
 (7,NULL,'Minh Tú','#3B5BA9',5,'Anime movie đỉnh nhất từ trước đến giờ. IMAX mà coi thì thần thánh luôn.',1,'2026-05-27'),
 (8,NULL,'Ngọc Hân','#0e2844',5,'Shinkai làm mình khóc lần nữa. Hình ảnh Tokyo mưa đẹp đến ám ảnh cả tuần sau.',1,'2026-05-21');

-- =====================================================================
--  SINH GHẾ, SUẤT CHIẾU, VÉ MẪU bằng STORED PROCEDURE
-- =====================================================================
DROP PROCEDURE IF EXISTS seed_seats;
DROP PROCEDURE IF EXISTS seed_showtimes;
DROP PROCEDURE IF EXISTS seed_bookings;
DELIMITER //

-- Sơ đồ ghế chuẩn theo web: 8 hàng A–H.
--  Hàng A,B,C,G: 12 ghế thường.  Hàng D,E,F: cột 3–10 VIP, còn lại thường.
--  Hàng H: 6 ghế đôi.
CREATE PROCEDURE seed_seats()
BEGIN
  DECLARE r INT DEFAULT 1; DECLARE rc INT; DECLARE ri INT; DECLARE ci INT;
  DECLARE v_row CHAR(2); DECLARE v_type INT;
  SELECT MAX(room_id) INTO rc FROM rooms;
  WHILE r <= rc DO
    SET ri = 0;
    WHILE ri <= 7 DO
      SET v_row = ELT(ri+1,'A','B','C','D','E','F','G','H');
      IF ri = 7 THEN
        SET ci = 1;
        WHILE ci <= 6 DO
          INSERT INTO seats(room_id,seat_row,seat_col,seat_code,seat_type_id)
            VALUES (r,v_row,ci,CONCAT(v_row,ci),3);
          SET ci = ci + 1;
        END WHILE;
      ELSE
        SET ci = 1;
        WHILE ci <= 12 DO
          IF ri >= 3 AND ri <= 5 AND ci >= 3 AND ci <= 10 THEN SET v_type = 2;
          ELSE SET v_type = 1; END IF;
          INSERT INTO seats(room_id,seat_row,seat_col,seat_code,seat_type_id)
            VALUES (r,v_row,ci,CONCAT(v_row,ci),v_type);
          SET ci = ci + 1;
        END WHILE;
      END IF;
      SET ri = ri + 1;
    END WHILE;
    SET r = r + 1;
  END WHILE;
END //

-- 5 phòng × 5 ngày (từ ngày chạy seed) × 6 khung giờ = 150 suất.
-- Dùng CURDATE() để bản demo không bao giờ hiển thị toàn lịch chiếu đã hết hạn.
-- Phim quay vòng trong 21 phim đang chiếu. Phòng IMAX/Gold ưu tiên định dạng tương ứng.
CREATE PROCEDURE seed_showtimes()
BEGIN
  DECLARE v_room INT DEFAULT 1; DECLARE rc INT; DECLARE d INT; DECLARE t INT;
  DECLARE v_movie INT; DECLARE v_format INT; DECLARE idx INT DEFAULT 0;
  SELECT MAX(room_id) INTO rc FROM rooms;
  WHILE v_room <= rc DO
    SET d = 0;
    WHILE d <= 4 DO
      SET t = 1;
      WHILE t <= 6 DO
        SET idx = idx + 1;
        SET v_movie = ((idx - 1) % 21) + 1;
        SET v_format = 1;
        IF v_room = 2 AND EXISTS(SELECT 1 FROM movie_formats WHERE movie_id=v_movie AND format_id=3) THEN
          SET v_format = 3;
        ELSEIF v_room = 4 AND EXISTS(SELECT 1 FROM movie_formats WHERE movie_id=v_movie AND format_id=2) THEN
          SET v_format = 2;
        END IF;
        INSERT INTO showtimes(movie_id,room_id,format_id,show_date,show_time)
          VALUES (v_movie, v_room, v_format,
                  DATE_ADD(CURDATE(), INTERVAL d DAY),
                  ELT(t,'09:15:00','11:40:00','14:20:00','17:00:00','19:30:00','21:50:00'));
        SET t = t + 1;
      END WHILE;
      SET d = d + 1;
    END WHILE;
    SET v_room = v_room + 1;
  END WHILE;
END //

-- 40 vé confirmed (mỗi vé 2 ghế) trên 40 suất đầu, xoay vòng 12 khách → có dữ liệu doanh thu.
CREATE PROCEDURE seed_bookings()
BEGIN
  DECLARE done INT DEFAULT 0; DECLARE v_show INT; DECLARE v_room INT;
  DECLARE n INT DEFAULT 0; DECLARE v_cust INT; DECLARE v_bk INT;
  DECLARE cur CURSOR FOR SELECT showtime_id, room_id FROM showtimes ORDER BY showtime_id LIMIT 40;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  OPEN cur;
  loop_b: LOOP
    FETCH cur INTO v_show, v_room;
    IF done THEN LEAVE loop_b; END IF;
    SET n = n + 1;
    SET v_cust = ((n - 1) % 12) + 1;
    INSERT INTO bookings(booking_code, showtime_id, customer_id, total_amount, payment_method, status, created_at)
      VALUES (CONCAT('BK', LPAD(n,5,'0')), v_show, v_cust, 0,
              ELT(1+((n-1)%4),'momo','vnpay','atm','visa'), 'confirmed',
              TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL (n%30) DAY)));
    SET v_bk = LAST_INSERT_ID();
    INSERT INTO booking_seats(booking_id, showtime_id, seat_id, price)
      SELECT v_bk, v_show, s.seat_id, st.default_price
      FROM seats s JOIN seat_types st ON st.seat_type_id = s.seat_type_id
      WHERE s.room_id = v_room
        AND s.seat_id NOT IN (SELECT seat_id FROM booking_seats WHERE showtime_id = v_show)
      ORDER BY s.seat_id LIMIT 2;
    UPDATE bookings SET total_amount =
      (SELECT COALESCE(SUM(price),0) FROM booking_seats WHERE booking_id = v_bk)
      WHERE booking_id = v_bk;
  END LOOP;
  CLOSE cur;
END //

DELIMITER ;

CALL seed_seats();
CALL seed_showtimes();
CALL seed_bookings();

DROP PROCEDURE seed_seats;
DROP PROCEDURE seed_showtimes;
DROP PROCEDURE seed_bookings;

-- ---------------------------------------------------------------------
-- KIỂM TRA NHANH
-- ---------------------------------------------------------------------
SELECT
 (SELECT COUNT(*) FROM movies)        AS movies,
 (SELECT COUNT(*) FROM seats)         AS seats,
 (SELECT COUNT(*) FROM showtimes)     AS showtimes,
 (SELECT COUNT(*) FROM bookings)      AS bookings,
 (SELECT COUNT(*) FROM booking_seats) AS tickets;
