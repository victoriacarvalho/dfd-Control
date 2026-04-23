import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

const unificarItem = (nome: any, spec: any = "") => {
  const n = String(nome || "EQUIPAMENTO")
    .toUpperCase()
    .trim();
  const s = String(spec || "")
    .toUpperCase()
    .trim();
  const texto = `${n} ${s}`;

  let base = n;

  if (
    texto.includes("MICROCOMPUTADOR") ||
    texto.includes("DESKTOP") ||
    texto.includes("COMPUTADOR")
  ) {
    base = "COMPUTADOR DESKTOP";
  } else if (texto.includes("NOTEBOOK") || texto.includes("LAPTOP")) {
    base = "NOTEBOOK";
  } else if (texto.includes("TABLET")) {
    base = "TABLET";
  }

  if (base.includes("COMPUTADOR") || base.includes("NOTEBOOK")) {
    if (texto.includes("16GB") || texto.includes("16 GB")) {
      return `${base} TIPO 2 (16GB)`;
    }

    if (texto.includes("4GB") || texto.includes("4 GB")) {
      return `${base} (4GB)`;
    }

    return `${base} TIPO 1 (8GB)`;
  }

  return base;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do processo ausente na URL" },
        { status: 400 },
      );
    }

    const equipamentos = await prisma.equipamento.findMany({
      where: { dfd: { processoId: id, deletedAt: null } },
      include: { dfd: true },
    });

    if (equipamentos.length === 0) {
      return NextResponse.json(
        { error: "Nenhum equipamento encontrado para gerar relatório." },
        { status: 404 },
      );
    }

    const setoresSet = new Set<string>();

    equipamentos.forEach((eq: any) => {
      const nomeSetor = eq.dfd.setor || eq.dfd.secretaria;
      setoresSet.add(nomeSetor.toUpperCase());
    });

    const setores = Array.from(setoresSet).sort();

    const itensMap = new Map<string, any>();

    equipamentos.forEach((eq: any) => {
      const nomePadronizado = unificarItem(eq.nome, eq.especificacao);

      if (!itensMap.has(nomePadronizado)) {
        const base: any = {
          descritivo: nomePadronizado,
          apresentacao: "UND",
          total: 0,
          saldoAtual: 0,
          solicitarQtde: 0,
        };
        setores.forEach((s: any) => (base[s] = 0));
        itensMap.set(nomePadronizado, base);
      }

      const item = itensMap.get(nomePadronizado);
      const nomeSetor = (eq.dfd.setor || eq.dfd.secretaria).toUpperCase();

      item[nomeSetor] += eq.quantidade;
      item.total += eq.quantidade;
    });

    const itens = Array.from(itensMap.values());

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Demanda Consolidada");

    const columns: any[] = [
      { header: "ITEM", key: "item", width: 8 },
      { header: "DESCRITIVO", key: "descritivo", width: 45 },
      { header: "APRESENTAÇÃO", key: "apresentacao", width: 15 },
    ];

    setores.forEach((s: any) => columns.push({ header: s, key: s, width: 6 }));

    columns.push({ header: "TOTAL", key: "total", width: 8 });
    columns.push({ header: "SALDO ATUAL", key: "saldoAtual", width: 15 });
    columns.push({ header: "SOLICITAR QTDE", key: "solicitarQtde", width: 15 });

    worksheet.columns = columns;

    itens.forEach((item: any, index: number) => {
      item.item = index + 1;
      item.solicitarQtde = {
        formula: `${item.total} - ${item.saldoAtual}`,
        result: item.total,
      };
      worksheet.addRow(item);
    });

    const headerRow = worksheet.getRow(1);
    headerRow.height = 130;

    headerRow.eachCell((cell: any, colNumber: number) => {
      cell.font = { bold: true, size: 10 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (colNumber >= 3) {
        cell.alignment = {
          textRotation: 90,
          vertical: "middle",
          horizontal: "center",
        };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }

      const isTotalOrBefore = colNumber <= 3 + setores.length + 1;
      if (isTotalOrBefore) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFB4C6E7" },
        };
      } else if (cell.value === "SALDO ATUAL") {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF4B084" },
        };
      } else if (cell.value === "SOLICITAR QTDE") {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFD966" },
        };
      }
    });

    worksheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber > 1) {
        row.eachCell((cell: any, colNumber: number) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          if (colNumber === 2) {
            cell.alignment = {
              vertical: "middle",
              horizontal: "left",
              wrapText: true,
            };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          }
          if (
            colNumber > 3 &&
            colNumber <= 3 + setores.length &&
            cell.value === 0
          ) {
            cell.value = "";
          }
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as BlobPart, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Estudo_Tecnico_${id}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("ERRO RELATÓRIO:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar Excel" },
      { status: 500 },
    );
  }
}
