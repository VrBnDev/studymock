/**
 * PDF Text Extraction Service
 * Extract text from PDF files entirely on the client side using pdfjs-dist.
 */

export async function extractTextFromPDF(file: File, onProgress?: (current: number, total: number) => void
): Promise<string> {
	if (typeof window === 'undefined') {
		return '';
	}

	try {
		// Import PDF.js dynamically
		const pdfjs = await import('pdfjs-dist');

		// Resolve o worker localmente pelo Vite
		const workerSrc = (
			await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
		).default;

		pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

		const arrayBuffer = await file.arrayBuffer();

		const loadingTask = pdfjs.getDocument({
			data: arrayBuffer
		});

		const pdf = await loadingTask.promise;

		const totalPages = pdf.numPages;
		let fullText = '';

		for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
			const page = await pdf.getPage(pageNum);

			const textContent = await page.getTextContent();

			const pageText = textContent.items
				.map((item: any) => ('str' in item ? item.str : ''))
				.join(' ');

			fullText += `\n[PÁGINA ${pageNum}]\n${pageText}\n`;

			onProgress?.(pageNum, totalPages);
		}

		return fullText.trim();
	} catch (error) {
		console.error('Erro na extração de texto do PDF:', error);

		throw new Error(
			'Falha ao processar o PDF. Certifique-se de que o arquivo não está corrompido ou protegido por senha.'
		);
	}
}