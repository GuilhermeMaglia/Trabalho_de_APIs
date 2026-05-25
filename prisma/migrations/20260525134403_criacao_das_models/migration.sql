-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(40) NOT NULL,
    `email` VARCHAR(60) NOT NULL,
    `obs` TEXT NULL,
    `saldo` DECIMAL(9, 2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `viagens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idCliente` INTEGER NOT NULL,
    `reservaid` INTEGER NOT NULL,
    `destino` VARCHAR(60) NOT NULL,
    `transporte` ENUM('Aereo', 'Maritmo', 'Terrestre') NOT NULL DEFAULT 'Terrestre',
    `preco` DECIMAL(10, 2) NOT NULL,
    `dataSaida` DATETIME(3) NOT NULL,
    `dataRetorno` DATETIME(3) NOT NULL,
    `roteiro` TEXT NULL,
    `localSaida` TEXT NULL,
    `Nvagas` DECIMAL(65, 30) NOT NULL,
    `Nreservas` DECIMAL(65, 30) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteid` INTEGER NOT NULL,
    `pacote` ENUM('Aereo', 'Turistico', 'Hospedagem', 'Experiência', 'SeguroViagem') NOT NULL,
    `preco` DECIMAL(9, 2) NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `viagens` ADD CONSTRAINT `viagens_idCliente_fkey` FOREIGN KEY (`idCliente`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `viagens` ADD CONSTRAINT `viagens_reservaid_fkey` FOREIGN KEY (`reservaid`) REFERENCES `reservas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_clienteid_fkey` FOREIGN KEY (`clienteid`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
