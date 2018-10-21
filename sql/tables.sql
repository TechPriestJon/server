DROP DATABASE data;
CREATE DATABASE data;

USE data; 

CREATE TABLE Tiles (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    height DOUBLE NOT NULL,
    discovered TINYINT NOT NULL DEFAULT 0,
    temperature DOUBLE NOT NULL
);

CREATE TABLE Expeditions (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    title VARCHAR(100) NOT NULL,
    guid VARCHAR(36) NOT NULL,
    numberOfPeople INT NOT NULL,
    massOfFood DOUBLE NOT NULL
);

CREATE TABLE WayPoints (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    expeditionId INT NOT NULL,
    tileId INT NOT NULL,
    routeOrder INT NOT NULL,
    FOREIGN KEY (expeditionId) REFERENCES Expeditions (id),
    FOREIGN KEY (tileId) REFERENCES Tiles (id)
);

CREATE TABLE ExpeditionStatusTypes (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    name VARCHAR(20) NOT NULL,
    description VARCHAR(100) NOT NULL
);
INSERT INTO ExpeditionStatusTypes (name,description) VALUES
("In Progress", "The expedition is currently underway."),
("Successful", "The expedition completed successfully"),
("Failed", "The expedition failed. :(");

CREATE TABLE ExpeditionStatuses (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    expeditionId INT NOT NULL,
    expeditionStatusTypeId INT NOT NULL,
    routeProgress INT NOT NULL,
    massOfFood DOUBLE NOT NULL,
    numberOfPeople INT NOT NULL,
	FOREIGN KEY (expeditionId) REFERENCES Expeditions (id),
    FOREIGN KEY (expeditionStatusTypeId) REFERENCES ExpeditionStatusTypes (id)
);