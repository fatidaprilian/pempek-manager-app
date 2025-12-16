import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TransactionItem } from './transactionService';

export const generateReportPDF = async (
  transactions: TransactionItem[], 
  totalIncome: number, 
  totalExpense: number
) => {
  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; }
          h1 { text-align: center; color: #333; }
          .summary { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
          .summary-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
          .total-net { font-weight: bold; font-size: 16px; border-top: 1px solid #ccc; padding-top: 5px; margin-top: 5px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .text-right { text-align: right; }
          .text-green { color: green; }
          .text-red { color: red; }
        </style>
      </head>
      <body>
        <h1>Laporan Keuangan Pempek</h1>
        <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>

        <div class="summary">
          <div class="summary-item">
            <span>Total Pemasukan:</span>
            <span class="text-green">Rp ${totalIncome.toLocaleString('id-ID')}</span>
          </div>
          <div class="summary-item">
            <span>Total Pengeluaran:</span>
            <span class="text-red">Rp ${totalExpense.toLocaleString('id-ID')}</span>
          </div>
          <div class="summary-item total-net">
            <span>Laba Bersih:</span>
            <span>Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Keterangan</th>
              <th class="text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(t => `
              <tr>
                <td>${new Date(t.createdAt.toDate()).toLocaleDateString('id-ID')}</td>
                <td>${t.type === 'sale' ? 'Penjualan' : 'Pengeluaran'}</td>
                <td>
                  ${t.type === 'sale' 
                    ? t.items?.map(i => `${i.productName} (${i.qty})`).join(', ') 
                    : t.note}
                </td>
                <td class="text-right ${t.type === 'sale' ? 'text-green' : 'text-red'}">
                  ${t.type === 'sale' ? '+' : '-'} Rp ${t.total.toLocaleString('id-ID')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error("Gagal print PDF:", error);
  }
};