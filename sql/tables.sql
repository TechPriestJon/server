DROP DATABASE data;
CREATE DATABASE data;

USE data; 

CREATE TABLE Tiles (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    height DOUBLE NOT NULL,
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

CREATE TABLE ExpeditionStatuses (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    expeditionId INT NOT NULL,
    routeProgress INT NOT NULL,
    massOfFood DOUBLE NOT NULL,
	FOREIGN KEY (expeditionId) REFERENCES Expeditions (id)
);