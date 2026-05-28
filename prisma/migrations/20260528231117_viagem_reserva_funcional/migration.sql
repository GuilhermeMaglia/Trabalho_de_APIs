-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(40) NOT NULL,
    `email` VARCHAR(60) NOT NULL,
    `obs` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `viagens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `destino` VARCHAR(60) NOT NULL,
    `transporte` ENUM('Aereo', 'Maritmo', 'Terrestre') NOT NULL DEFAULT 'Terrestre',
    `dataSaida` DATETIME(3) NOT NULL,
    `dataRetorno` DATETIME(3) NOT NULL,
    `roteiro` TEXT NULL,
    `localSaida` TEXT NULL,
    `Nvagas` INTEGER NOT NULL,
    `Nreservas` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NOT NULL,
    `viagemId` INTEGER NOT NULL,
    `pacote` ENUM('Aereo', 'Turistico', 'Hospedagem', 'Experiência', 'SeguroViagem') NOT NULL,
    `preco` DECIMAL(9, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_viagemId_fkey` FOREIGN KEY (`viagemId`) REFERENCES `viagens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
