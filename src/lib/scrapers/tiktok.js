import axios from "axios";
import * as cheerio from "cheerio";

const COOKIES = [
	"_ga=GA1.1.1131220858.1774759578",
	"_gcl_au=1.1.1031160630.1774759578",
	"_ga_ZSF3D6YSLC=GS2.1.s1774759577$o1$g0$t1774759577$j60$l0$h0",
].join("; ");

const HEADERS = {
	"User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
	"Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8",
	"Accept-Encoding": "gzip, deflate, br",
	"Cookie": COOKIES,
};

export class Tiktok {
	constructor() {
		this.http = axios.create({ headers: HEADERS, timeout: 30000, decompress: true });
	}

	async getToken() {
		const { data } = await this.http.get("https://ssstik.io/id");
		const m1 = data.match(/name=["']tt["']\s+value=["']([^"']+)["']/);
		const m2 = data.match(/value=["']([A-Za-z0-9+/=_-]{6,20})["']\s*>\s*<\/form/);
		const m3 = data.match(/[^a-z]tt\s*[:=]\s*["']([A-Za-z0-9+/=_-]{4,20})["']/);

		const token = m1?.[1] || m2?.[1] || m3?.[1] || "";
		if (!token) throw new Error("Token tt tidak ditemukan dari sistem ssstik!");
		return token;
	}

	async getCfTrace() {
		const { data } = await this.http.get("https://ssstik.io/cdn-cgi/trace");
		const ip = data.match(/ip=([^\n]+)/)?.[1] || "";
		const loc = data.match(/loc=([^\n]+)/)?.[1] || "ID";
		return { ip, loc };
	}

	async extract(tiktokUrl, token, cf) {
		const debug = encodeURIComponent(`ab=1&loc=${cf.loc}&ip=${cf.ip}`);
		const body = `id=${encodeURIComponent(tiktokUrl)}&locale=id&tt=${token}&debug=${debug}`;

		const { data } = await this.http.post("https://ssstik.io/abc?url=dl", body, {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Referer": "https://ssstik.io/id",
				"Origin": "https://ssstik.io",
				"HX-Request": "true",
				"HX-Trigger": "_gcaptcha_pt",
				"HX-Target": "target",
				"HX-Current-URL": "https://ssstik.io/id",
			},
		});
		return data;
	}

	parseResult(html) {
		const $ = cheerio.load(html);
		const author = $("h2").first().text().trim();
		const caption = $(".maintext").first().text().trim();
		const videoUrl = $("a.without_watermark:not(.without_watermark_hd)").attr("href") || "";
		const audioUrl = $("a.music").attr("href") || "";

		return { author, caption, videoUrl, audioUrl };
	}

	async scrape(tiktokUrl) {
		const [token, cf] = await Promise.all([this.getToken(), this.getCfTrace()]);
		const html = await this.extract(tiktokUrl, token, cf);
		return this.parseResult(html);
	}
            }
