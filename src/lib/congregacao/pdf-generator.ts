import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Membro, DesignacoesFeitas, PublicMeetingAssignment, NVMCDailyAssignments, NVMCParticipantDynamic, NVCVidaCristaDynamicPart } from './types';
import { NOMES_MESES, DIAS_REUNIAO, NOMES_DIAS_SEMANA_COMPLETOS, APP_NAME, FUNCOES_DESIGNADAS, GRUPOS_LIMPEZA_APOS_REUNIAO, NOMES_DIAS_SEMANA_ABREV, NONE_GROUP_ID, NVMC_PART_SECTIONS } from './constants';
import { formatarDataCompleta, formatarDataCompleta as formatarDataParaChaveOriginal } from './utils';

// Adicione esta interface para ajudar o TypeScript com o plugin autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// --- Constantes de Layout ---
const RP_MARGIN_TOP = 40;
const RP_MARGIN_BOTTOM = 40;
const RP_MARGIN_LEFT = 40;
const RP_MARGIN_RIGHT = 40;

const RP_MAIN_TITLE_FONT_SIZE = 18;
const RP_DATE_FONT_SIZE = 11;
const RP_THEME_FONT_SIZE = 13; 
const RP_DETAIL_FONT_SIZE = 10;
const RP_LINE_HEIGHT_FACTOR = 1.3;

const RP_SPACE_AFTER_MAIN_TITLE = 15;
const RP_SPACE_AFTER_DATE_AND_THEME = 25;
const RP_DETAIL_ITEM_VERTICAL_SPACING = RP_DETAIL_FONT_SIZE * 1.5;
const RP_SECTION_VERTICAL_SPACING = 40; 

const RP_BOX_PADDING = 15;
const RP_BOX_CORNER_RADIUS = 5;
const RP_BOX_BORDER_COLOR_R = 220;
const RP_BOX_BORDER_COLOR_G = 220;
const RP_BOX_BORDER_COLOR_B = 220;

// NOVO: Constantes para a linha do cabeçalho
const RP_HEADER_LINE_THICKNESS = 1.5;
const RP_HEADER_LINE_COLOR_R = 140; // Vermelho escuro/Borgonha
const RP_HEADER_LINE_COLOR_G = 0;
const RP_HEADER_LINE_COLOR_B = 20;
const RP_SPACE_AFTER_HEADER_LINE = 25;

const RP_COLOR_TEXT_DEFAULT_R = 30;

const getMemberNamePdf = (memberId: string | null | undefined, membros: Membro[]): string => {
  if (!memberId) return 'A Ser Designado';
  const member = membros.find(m => m.id === memberId);
  return member ? member.nome : 'Desconhecido';
};

function formatDisplayDateForPublicMeetingPdf(date: Date): string {
    const dayName = NOMES_DIAS_SEMANA_COMPLETOS[date.getUTCDay()];
    const day = date.getUTCDate();
    const monthName = NOMES_MESES[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    return `${dayName}, ${day} de ${monthName} de ${year}`;
}

export function generatePublicMeetingPdf(
  assignmentsForMonth: { [dateStr: string]: Omit<PublicMeetingAssignment, 'leitorId'> },
  mainScheduleForMonth: DesignacoesFeitas | null,
  allMembers: Membro[],
  mes: number,
  ano: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - RP_MARGIN_LEFT - RP_MARGIN_RIGHT;

  let currentY = RP_MARGIN_TOP;

  // --- Título Principal e Nova Linha ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(RP_MAIN_TITLE_FONT_SIZE);
  doc.setTextColor(RP_COLOR_TEXT_DEFAULT_R, RP_COLOR_TEXT_DEFAULT_R, RP_COLOR_TEXT_DEFAULT_R);
  doc.text(`REUNIÃO PÚBLICA`, pageWidth / 2, currentY, { align: 'center' });
  currentY += RP_MAIN_TITLE_FONT_SIZE * 0.7 + RP_SPACE_AFTER_MAIN_TITLE;

  // MODIFICADO: Desenha a nova linha horizontal abaixo do título
  const headerLineWidth = contentWidth * 0.4; // Linha com 40% da largura do conteúdo para elegância
  const lineX1 = (pageWidth / 2) - (headerLineWidth / 2);
  const lineX2 = (pageWidth / 2) + (headerLineWidth / 2);
  doc.setDrawColor(RP_HEADER_LINE_COLOR_R, RP_HEADER_LINE_COLOR_G, RP_HEADER_LINE_COLOR_B);
  doc.setLineWidth(RP_HEADER_LINE_THICKNESS);
  doc.line(lineX1, currentY, lineX2, currentY);
  currentY += RP_SPACE_AFTER_HEADER_LINE;
  // --- Fim do Cabeçalho ---


  const sundays = Object.keys(assignmentsForMonth)
    .map(dateStr => new Date(dateStr + "T00:00:00Z"))
    .filter(dateObj => dateObj.getUTCDay() === DIAS_REUNIAO.publica && assignmentsForMonth[formatarDataParaChaveOriginal(dateObj)])
    .sort((a, b) => a.getTime() - b.getTime());

  sundays.forEach((sundayDate, sundayIndex) => {
    if (sundayIndex > 0) {
        currentY += RP_SECTION_VERTICAL_SPACING;
    }

    const boxContentStartY = currentY;
    let contentY = boxContentStartY;

    const dateStr = formatarDataParaChaveOriginal(sundayDate);
    const assignment = assignmentsForMonth[dateStr];
    if (!assignment) return;
    
    // ... (lógica para pegar valores permanece a mesma)
    const leitorId = mainScheduleForMonth?.[dateStr]?.['leitorDom'] || null;
    let oradorBaseName: string = "A Ser Designado";
    const oradorInput = assignment.orador;
    if (oradorInput && oradorInput.trim() !== '') {
        const localMemberMatch = allMembers.find(m => m.id === oradorInput);
        oradorBaseName = localMemberMatch ? localMemberMatch.nome : oradorInput;
    }
    const congregacaoValue = assignment.congregacaoOrador || 'Local';
    const dirigenteValue = getMemberNamePdf(assignment.dirigenteId, allMembers);
    const leitorValue = getMemberNamePdf(leitorId, allMembers);
    const temaValue = assignment.tema || 'A Ser Anunciado';

    // Desenho da Data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(RP_DATE_FONT_SIZE);
    doc.setTextColor(RP_COLOR_TEXT_DEFAULT_R, RP_COLOR_TEXT_DEFAULT_R, RP_COLOR_TEXT_DEFAULT_R);
    doc.text(formatDisplayDateForPublicMeetingPdf(sundayDate), RP_MARGIN_LEFT, contentY);
    contentY += RP_DATE_FONT_SIZE * RP_LINE_HEIGHT_FACTOR * 1.5;

    // Desenho do Tema
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(RP_THEME_FONT_SIZE);
    const temaLines = doc.splitTextToSize(temaValue, contentWidth);
    doc.text(temaLines, RP_MARGIN_LEFT, contentY);
    contentY += (temaLines.length * RP_THEME_FONT_SIZE * RP_LINE_HEIGHT_FACTOR) + RP_SPACE_AFTER_DATE_AND_THEME;

    // Bloco de Participantes (sem alterações)
    const col1_X = RP_MARGIN_LEFT;
    const col2_X = RP_MARGIN_LEFT + (contentWidth / 2);
    const barSpacing = 8;
    const textX_Col1 = col1_X + barSpacing;
    const textX_Col2 = col2_X + barSpacing;
    const participantsTitleY = contentY;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(RP_DETAIL_FONT_SIZE);
    doc.text("Participantes", textX_Col1, participantsTitleY);
    const contentStartY = participantsTitleY + RP_DETAIL_FONT_SIZE * RP_LINE_HEIGHT_FACTOR;
    let line1_Y = contentStartY;
    let line2_Y = line1_Y + RP_DETAIL_ITEM_VERTICAL_SPACING;
    doc.setFont('helvetica', 'normal');
    doc.text(`Orador: ${oradorBaseName}`, textX_Col1, line1_Y);
    doc.text(`Dirigente: ${dirigenteValue}`, textX_Col2, line1_Y);
    doc.text(`Congregação: ${congregacaoValue}`, textX_Col1, line2_Y);
    doc.text(`Leitor: ${leitorValue}`, textX_Col2, line2_Y);
    const participantsBlockStartY = participantsTitleY - (RP_DETAIL_FONT_SIZE * 0.4);
    const participantsBlockEndY = line2_Y + (RP_DETAIL_FONT_SIZE * 0.4);
    doc.setDrawColor(0, 0, 0); 
    doc.setLineWidth(0.75);
    doc.line(col1_X, participantsBlockStartY, col1_X, participantsBlockEndY);
    doc.line(col2_X, participantsBlockStartY, col2_X, participantsBlockEndY);
    
    // Desenho do Box
    const boxContentEndY = participantsBlockEndY;
    const boxHeight = (boxContentEndY - boxContentStartY) + (RP_BOX_PADDING * 2);
    doc.setDrawColor(RP_BOX_BORDER_COLOR_R, RP_BOX_BORDER_COLOR_G, RP_BOX_BORDER_COLOR_B);
    doc.setLineWidth(1);
    doc.roundedRect(
      RP_MARGIN_LEFT - RP_BOX_PADDING,
      boxContentStartY - RP_BOX_PADDING,
      contentWidth + (RP_BOX_PADDING * 2),
      boxHeight,
      RP_BOX_CORNER_RADIUS,
      RP_BOX_CORNER_RADIUS
    );

    currentY = boxContentStartY - RP_BOX_PADDING + boxHeight;
  });

  doc.save(`reuniao_publica_${NOMES_MESES[mes].toLowerCase().replace(/ç/g, 'c').replace(/ã/g, 'a')}_${ano}.pdf`);
}

// Função para Cronograma Principal (Indicadores, Volantes, AV, Limpeza)
export function generateSchedulePdf(
  schedule: DesignacoesFeitas,
  members: Membro[],
  month: number,
  year: number
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - 2 * margin;

  const monthName = NOMES_MESES[month] || 'Mês Desconhecido';
  const mainTitleText = `Designações - ${monthName} de ${year}`;

  // Use a function to get member names safely within the PDF context
  const getMemberNamePdfLocal = (memberId: string | null | undefined): string => {
    if (!memberId || memberId === NONE_GROUP_ID || memberId.trim() === '') return '';
    const member = members.find(m => m.id === memberId);
    return member ? member.nome : 'Desconhecido';
  };

  let currentY = margin;

  // Helper function to check if we need a new page and reset Y
  const checkAndAddPage = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin; // Reset Y to top margin
      return true;
    }
    return false;
  };

  // Title (only on the first page)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(mainTitleText, pageWidth / 2, currentY, { align: 'center' });
  currentY += 18 * 0.7 + 30;

  // Filter dates that are meeting days (Thursday or Sunday) and have content
  const meetingDates = Object.keys(schedule)
    .map(dateStr => new Date(dateStr + 'T00:00:00Z'))
    .sort((a, b) => a.getTime() - b.getTime());

  // --- Indicadores Table ---
  if (meetingDates.length > 0) {
    // Check and add page if needed before drawing section title
    checkAndAddPage(14 * 0.7 + 10); // Height needed for section title + space

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Indicadores', margin, currentY);
    currentY += 14 * 0.7 + 10;

    const indicadoresHeaders = [['Data', 'Indicador 1', 'Indicador 2']];
    const indicadoresData = meetingDates.map(date => {
      const dateStr = formatarDataCompleta(date);
      const assignments = schedule[dateStr];
      return [
        formatarDataCompleta(date),
        getMemberNamePdfLocal(assignments?.['indicador1']),
        getMemberNamePdfLocal(assignments?.['indicador2'])
      ];
    });

    const result = (doc as any).autoTable({
      head: indicadoresHeaders,
      body: indicadoresData,
      startY: currentY,
      margin: { left: margin },
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    currentY = result.finalY + 20;
  }

  // --- Volantes Table ---
  if (meetingDates.length > 0) {
    // Check and add page if needed before drawing section title
    checkAndAddPage(14 * 0.7 + 10); // Height needed for section title + space

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Volantes', margin, currentY);
    currentY += 14 * 0.7 + 10;

    const volantesHeaders = [['Data', 'Volante 1', 'Volante 2']];
    const volantesData = meetingDates.map(date => {
      const dateStr = formatarDataCompleta(date);
      const assignments = schedule[dateStr];
      return [
        formatarDataCompleta(date),
        getMemberNamePdfLocal(assignments?.['volante1']),
        getMemberNamePdfLocal(assignments?.['volante2'])
      ];
    });

    const result = (doc as any).autoTable({
      head: volantesHeaders,
      body: volantesData,
      startY: currentY,
      margin: { left: margin },
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    currentY = result.finalY + 20;
  }

  // --- AV Table ---
  if (meetingDates.length > 0) {
     // Check and add page if needed before drawing section title
     checkAndAddPage(14 * 0.7 + 10); // Height needed for section title + space

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Auxiliar de Vídeo', margin, currentY);
    currentY += 14 * 0.7 + 10;

    const avHeaders = [['Data', 'Auxiliar de Vídeo']];
    const avData = meetingDates.map(date => {
      const dateStr = formatarDataCompleta(date);
      const assignments = schedule[dateStr];
      return [
        formatarDataCompleta(date),
        getMemberNamePdfLocal(assignments?.['av'])
      ];
    });

    const result = (doc as any).autoTable({
      head: avHeaders,
      body: avData,
      startY: currentY,
      margin: { left: margin },
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    currentY = result.finalY + 20;
  }

  // --- Limpeza Table ---
  if (meetingDates.length > 0) {
    // Check and add page if needed before drawing section title
    checkAndAddPage(14 * 0.7 + 10); // Height needed for section title + space

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Limpeza', margin, currentY);
    currentY += 14 * 0.7 + 10;

    const limpezaHeaders = [['Data', 'Responsável', 'Grupo']];
    const limpezaData = meetingDates.map(date => {
      const dateStr = formatarDataCompleta(date);
      const assignments = schedule[dateStr];
      return [
        formatarDataCompleta(date),
        getMemberNamePdfLocal(assignments?.['limpezaSemanalResponsavel']),
        getMemberNamePdfLocal(assignments?.['limpezaAposReuniaoGrupoId'])
      ];
    });

    const result = (doc as any).autoTable({
      head: limpezaHeaders,
      body: limpezaData,
      startY: currentY,
      margin: { left: margin },
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    currentY = result.finalY + 20;
  }

  doc.save(`designacoes_${monthName.toLowerCase().replace(/ç/g, 'c').replace(/ã/g, 'a')}_${year}.pdf`);
}

// Constantes para o PDF do NVMC
const NVMC_MARGIN_TOP = 40;
const NVMC_MARGIN_BOTTOM = 40;
const NVMC_MARGIN_LEFT = 40;
const NVMC_MARGIN_RIGHT = 40;

const NVMC_MAIN_TITLE_FONT_SIZE = 18;
const NVMC_DATE_FONT_SIZE = 11;
const NVMC_SECTION_FONT_SIZE = 13;
const NVMC_PART_FONT_SIZE = 10;
const NVMC_LINE_HEIGHT_FACTOR = 1.3;

const NVMC_SPACE_AFTER_MAIN_TITLE = 15;
const NVMC_SPACE_AFTER_DATE = 25;
const NVMC_SECTION_VERTICAL_SPACING = 40;

const NVMC_BOX_PADDING = 15;
const NVMC_BOX_CORNER_RADIUS = 5;
const NVMC_BOX_BORDER_COLOR_R = 220;
const NVMC_BOX_BORDER_COLOR_G = 220;
const NVMC_BOX_BORDER_COLOR_B = 220;

const NVMC_HEADER_LINE_THICKNESS = 1.5;
const NVMC_HEADER_LINE_COLOR_R = 140;
const NVMC_HEADER_LINE_COLOR_G = 0;
const NVMC_HEADER_LINE_COLOR_B = 20;
const NVMC_SPACE_AFTER_HEADER_LINE = 25;

const NVMC_COLOR_TEXT_DEFAULT_R = 30;

// --- Constantes de Cor para as Seções (Ajustadas para o novo layout) ---
const COR_SECAO_CABEÇALHO = [200, 200, 200]; // Cinza para cabeçalhos de semana
const COR_TESOUROS = [255, 235, 153]; // Amarelo claro
const COR_MINISTERIO = [255, 204, 153]; // Laranja claro
const COR_VIDA_CRISTA = [230, 184, 184]; // Vermelho/vinho claro
const COR_BORDA_SEMANA = [150, 150, 150]; // Cor da borda entre semanas

// Constants for layout
const NVMC_TABLE_STARTY = 45; // Adjusts the initial table position
// Remove margin constants, will calculate dynamically
// const NVMC_TABLE_MARGIN_LEFT = 15;
// const NVMC_TABLE_MARGIN_RIGHT = 15;
const NVMC_TABLE_COLUMN_STYLES = {
    0: { cellWidth: 40 }, // Time
    1: { cellWidth: 180 }, // Parte/Tema
    2: { cellWidth: 180 }, // Participante Sala A / Principal
    3: { cellWidth: 150 }, // Ajudante Sala A / Participante Sala B
};
const NVMC_DEFAULT_CELL_PADDING = 3;
const NVMC_DEFAULT_FONT_SIZE = 8; 

export function generateNvmcPdf(
  assignmentsByDate: { [dateStr: string]: NVMCDailyAssignments },
  allMembers: Membro[],
  month: number,
  year: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

   // Calculate total column width
   const totalColumnWidth = Object.values(NVMC_TABLE_COLUMN_STYLES).reduce((sum, col) => sum + (col.cellWidth as number), 0);

   // Calculate horizontal margin for centering
   const pageWidth = doc.internal.pageSize.getWidth();
   const horizontalMargin = (pageWidth - totalColumnWidth) / 2;

  // --- Função Auxiliar Interna ---
  const getMemberName = (memberId: string | null | undefined): string => {
    if (!memberId) return ''; // Use empty string for "A Ser Designado" in this format
    const member = allMembers.find(m => m.id === memberId);
    return member ? member.nome : 'Desconhecido';
  };

  const monthName = NOMES_MESES[month] || 'Mês Desconhecido';
  const mainTitleText = `Programação da reunião do meio de semana`;
  
  // Posição do título no topo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  // Adjust title position for centering with new margins
  doc.text(mainTitleText, pageWidth / 2, 30, { align: 'center' });

  // --- Preparação dos Dados para a Tabela (Estrutura Semanal) ---
  const sortedDates = Object.keys(assignmentsByDate)
    .map(dateStr => new Date(dateStr + "T00:00:00Z"))
    .sort((a, b) => a.getTime() - b.getTime());

  const body: (string | { content: string, colSpan?: number, rowSpan?: number, styles?: any })[][] = [];

  sortedDates.forEach((dateObj, index) => {
    const dateStr = formatarDataCompleta(dateObj);
    const assignments = assignmentsByDate[dateStr];
    if (!assignments) return;

    // Corrected usage of formatarDataCompleta
    const displayDate = formatarDataCompleta(dateObj); // YYYY-MM-DD
    // Omit theme as it's not directly on NVMCDailyAssignments
    const displayHeader = `${displayDate} |`

    const presidentName = getMemberName(assignments.presidenteId);
    const openingPrayerName = getMemberName(assignments.oracaoInicialId);

    // Add a separator row before each week except the first one
    if (index > 0) {
        body.push([
            { content: '', colSpan: 4, styles: { fillColor: COR_BORDA_SEMANA, cellPadding: 0, minCellHeight: 5 } }
        ]);
    }

    // Weekly Header Row (Date | Theme, President, Opening Prayer)
    body.push([
        // Use displayHeader which now only contains date
        { content: displayHeader, colSpan: 2, styles: { fontStyle: 'bold', fillColor: COR_SECAO_CABEÇALHO } },
        { content: 'Presidente: ' + presidentName, colSpan: 1, styles: { fontStyle: 'bold', fillColor: COR_SECAO_CABEÇALHO } },
        { content: 'Oração: ' + openingPrayerName, colSpan: 1, styles: { fontStyle: 'bold', fillColor: COR_SECAO_CABEÇALHO } },
    ]);

    // Initial Song and Comments
    body.push([
        '', // Time not available in type
        '• Cântico ' + (assignments.canticoInicialNumero || ''),
        '', // Participant column 1
        ''  // Participant column 2
    ]);
     body.push([
        '', // Time not available in type
        '• Comentários Iniciais' + (assignments.comentariosIniciaisDetalhes ? ' ' + assignments.comentariosIniciaisDetalhes : ''),
        '', // Participant column 1
        ''  // Participant column 2
     ]);


    // Seção de Tesouros
    body.push([
      { content: '', styles: { fillColor: COR_TESOUROS } },
      { content: 'TESOUROS DA PALAVRA DE DEUS', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold', fillColor: COR_TESOUROS } },
    ]);
    // Partes de Tesouros
    body.push([
        '', // Time not available in type
        '• ' + (assignments.tesourosDiscursoCustomTitle || 'Três perguntas...'),
        getMemberName(assignments.tesourosDiscursoId),
        '' // No second participant based on type
    ]);
    body.push([
        '', // Time not available in type
        '• ' + (assignments.joiasEspirituaisCustomTitle || 'Jóias Espirituais'),
        getMemberName(assignments.joiasEspirituaisId),
        '' // No second participant based on type
    ]);
    body.push([
        '', // Time not available in type
        '• ' + (assignments.leituraBibliaCustomTitle || 'Leitura da Bíblia'),
        getMemberName(assignments.leituraBibliaSalaAId),
        getMemberName(assignments.leituraBibliaSalaBId) // Participant Sala B
    ]);
     // Add Sala Adicional row if Sala B participant exists
     if (assignments.leituraBibliaSalaBId) {
         body.push([
            '',
            'Sala adicional',
            getMemberName(assignments.leituraBibliaSalaBId),
            ''
         ]);
     }


    // Seção Faça Seu Melhor no Ministério
    body.push([
      { content: '', styles: { fillColor: COR_MINISTERIO } },
      { content: 'FAÇA SEU MELHOR NO MINISTÉRIO', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold', fillColor: COR_MINISTERIO } },
    ]);
    // Partes de Faça Seu Melhor no Ministério
    assignments.fmmParts?.forEach(part => {
        body.push([
            '', // Time not available in type
            '• ' + part.partName + (part.partTheme ? ': ' + part.partTheme : ''),
            getMemberName(part.participantSalaAId),
            `${getMemberName(part.assistantSalaAId)}${part.participantSalaBId ? ' / Sala B: ' + getMemberName(part.participantSalaBId) : ''}` // Assistant or Sala B
        ]);
    });

    // Seção Nossa Vida Cristã
    body.push([
      { content: '', styles: { fillColor: COR_VIDA_CRISTA } },
      { content: 'NOSSA VIDA CRISTÃ', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold', fillColor: COR_VIDA_CRISTA } },
    ]);
    // Partes de Nossa Vida Cristã
    body.push([
        '', // Time not available in type
        '• Cântico ' + (assignments.vidaCristaCantico || ''), // Intermediate song
        '', // No participant listed
        ''  // No participant listed
    ]);
     assignments.vidaCristaParts?.forEach(part => {
        body.push([
            '', // Time not available in type
            '• ' + part.partName + (part.partTheme ? ': ' + part.partTheme : ''),
            getMemberName(part.participantId),
            '' // No second participant for these parts based on image
        ]);
    });
    body.push([
        '', // Time not available in type
        '• ' + (assignments.ebcCustomTitle || 'Estudo Bíblico de Congregação'),
        `Dirigente: ${getMemberName(assignments.ebcDirigenteId)}`,
        `Leitor: ${getMemberName(assignments.ebcLeitorId)}`
    ]);
     body.push([
        '', // Time not available in type
        '• ' + (assignments.comentariosFinaisDetalhes || 'Comentários Finais'),
        '', // No participant listed
        ''  // No participant listed
     ]);
    // Final Song and Prayer
    body.push([
        '', // Time not available in type
        '• Cântico ' + (assignments.canticoFinalNumero || ''),
        '', // No participant listed
        ''  // No participant listed
     ]);
     body.push([
        '', // Time not available in type
        '• Oração Final',
        getMemberName(assignments.oracaoFinalId),
        '' // No second participant
     ]);
  });

  // --- Geração da Tabela com Estilo Avançado ---
  (doc as any).autoTable({
    head: [], // No fixed header for this format, headers are part of the body per week
    body: body,
    startY: NVMC_TABLE_STARTY,
    // Use calculated horizontal margin for centering
    margin: { left: horizontalMargin, right: horizontalMargin },
    theme: 'grid',
    styles: {
      fontSize: NVMC_DEFAULT_FONT_SIZE,
      cellPadding: NVMC_DEFAULT_CELL_PADDING,
      valign: 'top', // Align text to top
      overflow: 'linebreak',
      lineWidth: 0.2, // thinner lines
      lineColor: [220, 220, 220], // lighter lines
    },
    headStyles: {
       // These styles are applied to the 'head' array, which is empty now.
       // Section header styles are applied inline in the body data.
    },
    columnStyles: NVMC_TABLE_COLUMN_STYLES,
     // Adding didDrawPage hook for footer
     didDrawPage: (data: any) => {
       // Add S-140 identifier at the bottom left
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(8);
       doc.setTextColor(150, 150, 150);
       // Adjust footer position based on horizontal margin
       doc.text('S-140 11/23', horizontalMargin, doc.internal.pageSize.getHeight() - 10);
     },
     // Optional: add a hook to fine-tune row heights or other details
     // didParseCell: (data) => { /* ... */ },
     // willDrawCell: (data) => { /* ... */ },
     // didDrawCell: (data) => { /* ... */ },
  });

  doc.save(`programacao_reuniao_${monthName.toLowerCase()}_${year}.pdf`);
}

    

    

    
