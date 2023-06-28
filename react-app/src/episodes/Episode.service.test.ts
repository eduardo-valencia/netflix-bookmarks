/**
 * ! Important
 *
 * We reset mocks after each test.
 *
 * * Notes
 *
 * - An "episode tab" is an active tab with a Netflix episode.
 */

import _ from "lodash";
import {
  EpisodeTime,
  MessageToSetEpisodeTime,
  Messages,
  PossibleEpisodeTime,
} from "../../../common/messages";
import { TabsRepoAbstraction } from "../tabs/Tabs.repo-abstraction";
import { EpisodeService, PossibleTab } from "./Episode.service";

/**
 * We are mocking this instead of treating this like a real repo. Otherwise,
 * we'd have to add methods to add and delete tabs.
 */
class CustomTabsRepo extends TabsRepoAbstraction {
  public sendMessage: jest.MockedFn<TabsRepoAbstraction["sendMessage"]> =
    jest.fn();

  public query: jest.MockedFn<TabsRepoAbstraction["query"]> = jest.fn();
}

/**
 * Repos and services
 */
const tabsRepo = new CustomTabsRepo();
const {
  getTimeOf1stEpisodeTab: findTimeOf1stEpisodeTab,
  findOneEpisodeTab,
  sendMessageToSetEpisodeTime,
  findOneEpisodeTabByUrl,
} = new EpisodeService({
  tabsRepo,
});

/**
 * Other common utils
 */
type Tab = chrome.tabs.Tab;

const generateTabId = (): number => {
  const idString = _.uniqueId();
  return parseInt(idString);
};

const generateEpisodeTab = () => {
  const tab: Pick<Tab, "url" | "active" | "id"> = {
    url: "http://netflix.com/watch/81091396",
    active: true,
    id: generateTabId(),
  };
  return tab as Tab;
};

const mockTabWithEpisode = (): Tab => {
  const tab: Tab = generateEpisodeTab();
  tabsRepo.query.mockResolvedValue([tab]);
  return tab;
};

const mockNoTabs = (): void => {
  // We pretend that there are no tabs
  tabsRepo.query.mockResolvedValue([]);
};

afterEach(() => {
  jest.resetAllMocks();
});

describe("findOneEpisodeTab", () => {
  it("Returns a tab", async () => {
    const mockedTab: Tab = mockTabWithEpisode();
    const tab: PossibleTab = await findOneEpisodeTab();
    expect(tab).toEqual(mockedTab);
  });

  // So the extension doesn't need extra permissions
  it("Queries the tabs repo for active tabs", async () => {
    mockTabWithEpisode();
    await findOneEpisodeTab();
    expect(tabsRepo.query).toBeCalledWith({ active: true });
  });

  describe("When it does not have an episode URL", () => {
    const getActiveTab = (): Tab => {
      const episodeTab: Tab = generateEpisodeTab();
      // So that it doesn't have an episode's URL.
      episodeTab.url = "https://not-an-episode-tab.com";
      return episodeTab;
    };

    const mockActiveTab = (): void => {
      const tab: Tab = getActiveTab();
      tabsRepo.query.mockResolvedValue([tab]);
    };

    beforeAll(() => {
      mockActiveTab();
    });

    it("Does not return an active tab", async () => {
      const tab: PossibleTab = await findOneEpisodeTab();
      expect(tab).toBeNull();
    });
  });
});

describe("getTimeOf1stEpisodeTab", () => {
  const callMethodAndExpectError = async (): Promise<void> => {
    const promise: Promise<PossibleEpisodeTime> = findTimeOf1stEpisodeTab();
    await expect(promise).rejects.toBeTruthy();
  };

  describe("When the content script responds with the time", () => {
    const mockedEpisodeTime: EpisodeTime = 1000;

    const mockTimeResponse = (): void => {
      tabsRepo.sendMessage.mockResolvedValue(mockedEpisodeTime);
    };

    beforeAll(() => {
      mockTabWithEpisode();
      mockTimeResponse();
    });

    it("Returns the episode's time", async () => {
      const time: PossibleEpisodeTime = await findTimeOf1stEpisodeTab();
      expect(time).toEqual(mockedEpisodeTime);
    });
  });

  it("Throws an error when the content script does not respond with a time", async () => {
    mockTabWithEpisode();
    tabsRepo.sendMessage.mockResolvedValue(null);
    await callMethodAndExpectError();
  });

  it("Throws an error when we try returning the time when there is no Netflix tab open", async () => {
    mockNoTabs();
    await callMethodAndExpectError();
  });
});

describe("sendMessageToSetEpisodeTime", () => {
  describe("After calling it when there is an episode tab", () => {
    let tab: Tab;
    const timeMs: MessageToSetEpisodeTime["timeMs"] = 1000;

    const getMessage = (): MessageToSetEpisodeTime => {
      return { type: Messages.setEpisodeTime, timeMs: 1000 };
    };

    beforeAll(async () => {
      tab = mockTabWithEpisode();
      await sendMessageToSetEpisodeTime(timeMs);
    });

    it("Sends a message", () => {
      const message: MessageToSetEpisodeTime = getMessage();
      expect(tabsRepo.sendMessage).toHaveBeenCalledWith(tab.id, message);
    });
  });

  it("Throws an error when it cannot find an episode tab", async () => {
    mockNoTabs();
    const promise: Promise<void> = sendMessageToSetEpisodeTime(1000);
    await expect(promise).rejects.toBeTruthy();
  });
});

describe("findOneEpisodeTabByUrl", () => {
  describe("Even when there are multiple episode tabs", () => {
    let tabToFind: Tab;

    const generateTabWithOtherUrl = (): Tab => {
      const tab: Tab = generateEpisodeTab();
      tab.url = "http://example.com";
      return tab;
    };

    const getTabs = (): Tab[] => {
      tabToFind = generateEpisodeTab();
      const tabWithOtherUrl: Tab = generateTabWithOtherUrl();
      return [tabWithOtherUrl, tabToFind];
    };

    beforeAll(() => {
      const tabs: Tab[] = getTabs();
      tabsRepo.query.mockResolvedValue(tabs);
    });

    it("Returns the episode tab with the URL", async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const tab: PossibleTab = await findOneEpisodeTabByUrl(tabToFind.url!);
      expect(tab).toEqual(tabToFind);
    });
  });
});
