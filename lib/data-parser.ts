import { Operation } from '@/types';

export function parseRawData(raw: string): Partial<Operation>[] {
  const lines = raw.trim().split('\n');
  return lines.map(line => {
    const parts = line.split('\t');
    if (parts.length < 9) return null;

    // Handle both 9 and 10 parts (sector may be empty)
    // 0: initialMeter, 1: operatorName, 2: tractor, 3: implement, 4: task, 5: crop, 6: sector, 7: finalMeter, 8: date, 9: totalHours
    
    const initialMeter = parseFloat(parts[0].replace(',', '.'));
    const operatorName = parts[1];
    const tractor = parts[2];
    const implement = parts[3];
    const task = parts[4];
    const crop = parts[5];
    const sector = parts[6] || 'Geral';
    const finalMeter = parseFloat(parts[7].replace(',', '.'));
    const dateStr = parts[8];
    const totalHours = parseFloat(parts[9]?.replace(',', '.') || '0');

    if (isNaN(initialMeter)) {
      console.warn('Invalid initialMeter:', parts[0]);
    }

    // Convert DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = dateStr.split('/');
    const date = `${year}-${month}-${day}`;

    const op = {
      date,
      operatorName,
      tractor,
      implement,
      task,
      crop,
      sector,
      initialMeter: isNaN(initialMeter) ? 0 : initialMeter,
      finalMeter: isNaN(finalMeter) ? null : finalMeter,
      totalHours: isNaN(totalHours) ? 0 : totalHours,
      synced: true,
      createdAt: new Date().toISOString(),
      operatorId: 'IMPORTED_DATA'
    };

    console.log('Parsed operation:', op);
    return op;
  }).filter(Boolean) as Partial<Operation>[];
}
