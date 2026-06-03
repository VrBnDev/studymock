/**
 * PDF Text Extraction Service
 * Extract text from PDF files entirely on the client side using pdfjs-dist.
 */

export async function extractTextFromPDF(
	file: File,
	onProgress?: (current: number, total: number) => void
): Promise<string> {
	if (typeof window === 'undefined') {
		return '';
	}

	try {
		// Import PDFJS dynamically to avoid SSR issues
		const pdfjs = await import('pdfjs-dist');
		
		// Configure CDN Worker matching standard pdfjs version
		pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.370/pdf.worker.min.mjs`;

		const arrayBuffer = await file.arrayBuffer();
		const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
		
		const pdf = await loadingTask.promise;
		const totalPages = pdf.numPages;
		let fullText = '';

		for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
			const page = await pdf.getPage(pageNum);
			const textContent = await page.getTextContent();
			
			// Join text elements with space
			const pageText = textContent.items
				.map((item: any) => item.str)
				.join(' ');
			
			fullText += `\n[PÁGINA ${pageNum}]\n${pageText}\n`;
			
			if (onProgress) {
				onProgress(pageNum, totalPages);
			}
		}

		return fullText;
	} catch (error) {
		console.error('Erro na extração de texto do PDF:', error);
		throw new Error('Falha ao processar o PDF. Certifique-se de que não esteja protegido por senha.');
	}
}
