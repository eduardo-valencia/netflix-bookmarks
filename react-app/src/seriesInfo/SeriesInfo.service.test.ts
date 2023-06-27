import axios, { AxiosInstance, AxiosResponse } from "axios";
import { SeriesName, SeriesInfoService } from "./SeriesInfo.service";
import config, { Config } from "../config";

describe("When Axios returns Netflix's HTML", () => {
  let service: SeriesInfoService;
  let spiedGet: jest.SpiedFunction<AxiosInstance["get"]>;
  const episodeName = "Demon Slayer: Kimetsu no Yaiba";
  const episodeHref = "/watch/81091396";
  const episodeUrl = `http://netflix.com${episodeHref}`;

  const getMockedHtml = (): string => {
    return `
    <script type="application/ld+json">
    {"name": "${episodeName}"}
    </script>
    `;
  };

  const getMockedResponseInfo = () => {
    type MockedResponseData = Pick<AxiosResponse, "status" | "data">;
    const html: string = getMockedHtml();
    return { status: 200, data: html } as MockedResponseData as AxiosResponse;
  };

  const mockResponseOfGetMethod = (axiosInstance: AxiosInstance): void => {
    spiedGet = jest.spyOn(axiosInstance, "get");
    const response: AxiosResponse = getMockedResponseInfo();
    spiedGet.mockResolvedValue(response);
  };

  const mockAxios = (): AxiosInstance => {
    const axiosInstance: AxiosInstance = axios.create();
    mockResponseOfGetMethod(axiosInstance);
    return axiosInstance;
  };

  const getRequestedUrl = (): string => {
    const [url] = spiedGet.mock.lastCall;
    return url;
  };

  const getNameForEpisode = (): Promise<SeriesName> => {
    return service.getSeriesName(episodeUrl);
  };

  type ExpectedHref = string;

  const validateRequestedUrl = (expectedHref: ExpectedHref): void => {
    const url: string = getRequestedUrl();
    const { host, protocol } = new URL(config.apiUrl);
    expect(url).toEqual(`${protocol}//${host}${expectedHref}`);
  };

  interface OptionsToTestRequestedUrl {
    apiUrlOfConfig: Config["apiUrl"];
    expectedHref: ExpectedHref;
  }

  const setApiUrlAndGetSeriesInfoAndTestRequestedUrl = async ({
    apiUrlOfConfig,
    expectedHref,
  }: OptionsToTestRequestedUrl): Promise<void> => {
    config.apiUrl = apiUrlOfConfig;
    await getNameForEpisode();
    validateRequestedUrl(expectedHref);
  };

  beforeAll(() => {
    service = new SeriesInfoService({ httpRepo: mockAxios() });
  });

  it("Returns the series's name", async () => {
    const info: SeriesName = await getNameForEpisode();
    expect(info).toEqual(episodeName);
  });

  it("Requests our API instead of Netflix", async () => {
    await setApiUrlAndGetSeriesInfoAndTestRequestedUrl({
      apiUrlOfConfig: "http://localhost:5000",
      expectedHref: episodeHref,
    });
  });

  it("Uses the correct URL to request our API when its URL has a trailing slash", async () => {
    await setApiUrlAndGetSeriesInfoAndTestRequestedUrl({
      apiUrlOfConfig: "http://localhost:5000/",
      expectedHref: episodeHref,
    });
  });

  it("Requests the API with the correct URL when the API's URL has extra fragments", async () => {
    const hrefOfApiUrl = "/api";
    await setApiUrlAndGetSeriesInfoAndTestRequestedUrl({
      apiUrlOfConfig: `http://localhost:5000${hrefOfApiUrl}`,
      expectedHref: `${hrefOfApiUrl}${episodeHref}`,
    });
  });
});

/**
 * We don't need to make these tests now because we only need to throw errors
 * for logging purposes.
 */
it.todo("Throws an error when it cannot get the name from the HTML");

it.todo("Throws an error when it cannot parse the metadata's JSON");

it.todo("Throws an error when it cannot parse the HTML");

it.todo("Throws an error when the request fails");
