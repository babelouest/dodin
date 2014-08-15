<?php
/**
 * re:mpd.class.php - PHP object interface to MPD (Music Player Daemon)
 * version 0.1.1 (2012-07-29)
 *
 * Based on mpd.class.php version 1.2 by Benjamin Carlisle, for a documentation
 * of changes see included CHANGELOG file.
 *
 * Copyright (C) 2011-2012	Marcus Geuecke (web10mpc [at] geuecke [dot] org)
 * http://web10mpc.geuecke.org | http://mpd.wikia.com/
 *
 * Copyright (C) 2003-2004	Benjamin Carlisle (bcarlisle@24oz.com)
 * http://mpd.24oz.com/ | http://www.musicpd.org/
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA	02110-1301, USA.
 *
 * @author Marcus Geuecke
 * @version 0.1.1
 * @package re-mpd-class
 */

/**#@+
 * Common MPD command definitions.
 */
// command lists
define("MPD_CMD_START_BULK", "command_list_begin");
define("MPD_CMD_END_BULK",   "command_list_end");

// status
define("MPD_CMD_STATUS",     "status");
define("MPD_CMD_STATISTICS", "stats");

// playback options
define("MPD_CMD_CONSUME",   "consume");
define("MPD_CMD_CROSSFADE", "crossfade");
define("MPD_CMD_RANDOM",    "random");
define("MPD_CMD_REPEAT",    "repeat");
define("MPD_CMD_SINGLE",    "single");
define("MPD_CMD_VOLUME",    "setvol");

// controlling playback
define("MPD_CMD_NEXT",  "next");
define("MPD_CMD_PAUSE", "pause");
define("MPD_CMD_PLAY",  "play");
define("MPD_CMD_PREV",  "previous");
define("MPD_CMD_SEEK",  "seek");
define("MPD_CMD_STOP",  "stop");

// the current playlist
define("MPD_CMD_PLADD",        "add");
define("MPD_CMD_PLCLEAR",      "clear");
define("MPD_CMD_PLREMOVE",     "delete");
define("MPD_CMD_PLMOVETRACK",  "move");
define("MPD_CMD_PLINFO",       "playlistinfo");
define("MPD_CMD_PLSHUFFLE",    "shuffle");
define("MPD_CMD_PLSWAPTRACKS", "swap");

// stored playlists
define("MPD_CMD_PLLIST",   "listplaylists");
define("MPD_CMD_PLLOAD",   "load");
define("MPD_CMD_PLDELETE", "rm");
define("MPD_CMD_PLSAVE",   "save");

// the music database
define("MPD_CMD_FIND",    "find");
define("MPD_CMD_TABLE",   "list");
define("MPD_CMD_LSDIR",   "lsinfo");
define("MPD_CMD_SEARCH",  "search");
define("MPD_CMD_REFRESH", "update");

// connection settings
define("MPD_CMD_CLOSE",    "close");
define("MPD_CMD_SHUTDOWN", "kill");
define("MPD_CMD_PASSWORD", "password");
/**#@-*/

/**#@+
 * Dummy commands to demonstrate the usage of the compatibility table.
 */
define("MPD_CMD_DUMMY_MIN", "dummy_min");
define("MPD_CMD_DUMMY_MAX", "dummy_max");
/**#@-*/

/**#@+
 * Predefined MPD response messages.
 */
define("MPD_RESPONSE_OK",  "OK");
define("MPD_RESPONSE_ERR", "ACK");
/**#@-*/

/**#@+
 * MPD searching constants.
 */
define("MPD_SEARCH_ARTIST", "artist");
define("MPD_SEARCH_ALBUM",  "album");
define("MPD_SEARCH_TITLE",  "title");
/**#@-*/

/**#@+
 * MPD sorting constants.
 */
define("MPD_SORT_DEFAULT",  "default");
define("MPD_SORT_SAMPLERS", "samplers");
define("MPD_SORT_UNSORTED", "unsorted");
/**#@-*/

/**#@+
 * MPD state constants.
 */
define("MPD_STATE_PLAYING", "play");
define("MPD_STATE_STOPPED", "stop");
define("MPD_STATE_PAUSED",  "pause");
/**#@-*/

/**#@+
 * MPD cache tables.
 */
define("MPD_TBL_ARTIST", "artist");
define("MPD_TBL_ALBUM",  "album");
/**#@-*/

/**
 * @author Marcus Geuecke
 * @package re-mpd-class
 */
class Mpd {
	// ----------------------------- class constants -----------------------------

	const MPD_CLASS_VERSION = "0.1.1";

	// ------------------------ private member variables -------------------------

	/**#@+
	 * TCP connection variables
	 */
	private $mpdSocket = NULL;
	private $host = "127.0.0.1";
	private $port = 6600;
	private $password = "";
	private $connected = FALSE;
	/**#@-*/

	/**#@+
	 * MPD status variables
	 */
	private $volume = 0;
	private $repeat = 0;
	private $random = 0;
	private $single = 0;
	private $consume = 0;
	private $state = MPD_STATE_STOPPED;
	private $currentTrackID = -1;
	private $currentTrackPosition = -1;
	private $currentTrackLength = -1;
	private $bitrate = 0;
	private $crossfade = 0;
	/**#@-*/

	/**#@+
	 * MPD statistics variables
	 */
	private $numArtists = 0;
	private $numSongs = 0;
	private $numAlbums = 0;
	private $uptime = 0;
	private $playtime = 0;
	private $dbPlaytime = 0;
	private $dbLastRefreshed = 0;
	/**#@-*/

	/**#@+
	 * playlist variables
	 */
	private $playlist = array();
	private $playlistCount = 0;
	/**#@-*/

	/**#@+
	 * command compatibility tables
	 */
	private $COMPATIBILITY_MIN_TBL = array(
		MPD_CMD_DUMMY_MIN => "0.16.0"
	);

	private $COMPATIBILITY_MAX_TBL = array(
		MPD_CMD_DUMMY_MAX => "0.15.0"
	);
	/**#@-*/

	// misc. other variables

	/**
	 * @var string Holds the list of commands for bulk command sending.
	 */
	private $commandQueue = "";
	/**
	 * @var string Used for maintaining information about the last error message.
	 */
	private $lastError = "";
	/**
	 * @var string Version of MPD protocol spoken (*not* the actual daemon version!).
	 */
	private $mpdProtocolVersion = "0.0.0";
	/**
	 * @var bool Set to TRUE to turn extended debugging on.
	 */
	private $debugging = FALSE;

	// ***************************************************************************
	// ****************** CONSTRUCTOR, DESTRUCTOR, MAGIC GETTER ******************
	// ***************************************************************************

	/**
	 * Constructor.
	 *
	 * Build the MPD object, connect to the server and refresh all local object
	 * properties.
	 *
	 * @param string $host MPD server hostname
	 * @param integer $port MPD server port
	 * @param string $password MPD server password (optional)
	 */
	public function __construct($host, $port, $password = NULL) {
		$this->host = $host;
		$this->port = $port;
		$this->password = $password;

		if (!is_null($response = $this->Connect())) {
			list ($this->mpdProtocolVersion) = sscanf($response, MPD_RESPONSE_OK . " MPD %s\n");

			if (!is_null($password)) {
				// Try to login using the supplied password.
				if (is_null($this->SendCommand(MPD_CMD_PASSWORD, $password))) {
					// Bad password or command.
					$this->connected = FALSE;
					$this->SetError("Bad password or command.");
					return;
				}

				// Try to update the object properties.
				if (is_null($this->RefreshInfo())) {
					// No read access. (Might as well be disconnected!)
					$this->connected = FALSE;
					$this->SetError("Supplied password does not have read access.");
					return;
				}
			} else {
				// No password supplied, try to update the object properties without
				// one.
				if (is_null($this->RefreshInfo())) {
					// No read access. (Might as well be disconnected!)
					$this->connected = FALSE;
					$this->SetError("Password required to access server.");
					return;
				}
			}
		}
	}

	/**
	 * Destructor.
	 *
	 * Destroy the MPD object, close the connection to the server.
	 */
	public function __destruct() {
		if ($this->connected) {
			$this->Disconnect();
		}
	}

	/**
	 * Magic getter for allowed properties.
	 *
	 * If access to the requested property is not allowed or the property does not
	 * exist, the function will throw an Exception.
	 *
	 * @param string $property The name of the property to read.
	 * @return mixed The requested property.
	 */
	public function __get($property) {
		$forbidden = array("mpdSocket", "host", "port", "password",
			"COMPATIBILITY_MIN_TBL", "COMPATIBILITY_MAX_TBL", "commandQueue");

		if ((!in_array($property, $forbidden)) && property_exists($this, $property)) {
				return $this->$property;
		} else {
			throw new Exception("Access to property '" . $property . "' not allowed or property does not exist.");
		}
	}

	// ***************************************************************************
	// **************************** PLAYBACK OPTIONS *****************************
	// ***************************************************************************

	/**
	 * Set consume mode. Tells MPD to remove played songs from the playlist.
	 *
	 * @param integer $consume_value 1: enable, 0: disable
	 * @return string|null server response string or NULL on error
	 */
	public function SetConsume($consume_value) {
		$this->DebugPrintCall("SetConsume");

		// Set consume mode and update property on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_CONSUME, $consume_value))) {
			$this->consume = $consume_value;
		}

		$this->DebugPrintReturn("SetConsume");
		return $response;
	}

	/**
	 * Set random mode. Tells MPD to play songs from the playlist in random order.
	 *
	 * @param integer $random_value 1: enable, 0: disable
	 * @return string|null server response string or NULL on error
	 */
	public function SetRandom($random_value) {
		$this->DebugPrintCall("SetRandom");

		// Set random mode and update property on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_RANDOM, $random_value))) {
			$this->random = $random_value;
		}

		$this->DebugPrintReturn("SetRandom");
		return $response;
	}

	/**
	 * Set repeat mode. Tells MPD to continually loop the playlist (single mode
	 * disabled) or the current song (single mode enabled).
	 *
	 * @param integer $repeat_value 1: enable, 0: disable
	 * @return string|null server response string or NULL on error
	 */
	public function SetRepeat($repeat_value) {
		$this->DebugPrintCall("SetRepeat");

		// Set repeat mode and update property on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_REPEAT, $repeat_value))) {
			$this->repeat = $repeat_value;
		}

		$this->DebugPrintReturn("SetRepeat");
		return $response;
	}

	/**
	 * Set single mode. Tells MPD to stop playback after the current song or to
	 * repeat the current song if repeat mode is enabled.
	 *
	 * @param integer $single_value 1: enable, 0: disable
	 * @return string|null server response string or NULL on error
	 */
	public function SetSingle($single_value) {
		$this->DebugPrintCall("SetSingle");

		// Set single mode and update property on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_SINGLE, $single_value))) {
			$this->single = $single_value;
		}

		$this->DebugPrintReturn("SetSingle");
		return $response;
	}

	/**
	 * Set the mixer volume to <new_volume>.
	 *
	 * @param integer $new_volume the new volume (range: 0 - 100)
	 * @return string|null server response string or NULL on error
	 */
	public function SetVolume($new_volume) {
		$this->DebugPrintCall("SetVolume");

		if (!is_numeric($new_volume)) {
			$this->SetError("SetVolume(): argument 1 must be a numeric value.");
			return NULL;
		}

		// Limit value to the range of 0-100.
		if ($new_volume < 0) {
			$new_volume = 0;
		}

		if ($new_volume > 100) {
			$new_volume = 100;
		}

		// Set volume and update property on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_VOLUME, $new_volume))) {
			$this->volume = $new_volume;
		}

		$this->DebugPrintReturn("SetVolume");
		return $response;
	}

	/**
	 * Adjust the mixer volume by <modifier>, which can be a positive (volume
	 * increase) or negative (volume decrease) value.
	 *
	 * @param integer $modifier the volume modifier to apply (range: -100 - 100)
	 * @return string|null server response string or NULL on error
	 */
	public function AdjustVolume($modifier) {
		$this->DebugPrintCall("AdjustVolume");

		if (!is_numeric($modifier)) {
			$this->SetError("AdjustVolume(): argument 1 must be a numeric value.");
			return NULL;
		}

		$this->RefreshInfo();
		$new_volume = $this->volume + $modifier;
		$response = $this->SetVolume($new_volume);

		$this->DebugPrintReturn("AdjustVolume");
		return $response;
	}

	/**
	 * Set the crossfade time between tracks in seconds. 0 = disabled.
	 *
	 * @param integer $seconds the crossfade time in seconds (range: 0 - 30)
	 * @return string|null server response string or NULL on error
	 */
	public function SetCrossFade($seconds = 0) {
		$this->DebugPrintCall("SetCrossFade");

		if (!is_numeric($seconds)) {
			$this->SetError("AdjustVolume(): argument 1 must be a numeric value.");
			return NULL;
		}

		// Limit value to the range of 0-20.
		if ($seconds < 0) {
			$seconds = 0;
		}

		if ($seconds > 30) {
			$seconds = 30;
		}

		// Set xfade and update property on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_CROSSFADE, $seconds))) {
			$this->crossfade = $seconds;
		}

		$this->DebugPrintReturn("SetCrossFade");
	}

	// ***************************************************************************
	// ************************** CONTROLLING PLAYBACK ***************************
	// ***************************************************************************

	/**
	 * If playing, skip to the next song in the playlist.
	 *
	 * @return string|null server response string or NULL on error
	 */
	public function Next() {
		$this->DebugPrintCall("Next");

		if (!is_null($response = $this->SendCommand(MPD_CMD_NEXT))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("Next");
		return $response;
	}

	/**
	 * Toggles pausing. Calling it once will pause the player, calling it again
	 * will continue playback.
	 *
	 * @return string|null server response string or NULL on error
	 */
	public function Pause() {
		$this->DebugPrintCall("Pause");
		$response = NULL;

		if ($this->state == MPD_STATE_PLAYING) {
			$response = $this->SendCommand(MPD_CMD_PAUSE, 1);
		} else {
			$response = $this->SendCommand(MPD_CMD_PAUSE, 0);
		}

		if (!is_null($response)) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("Pause");
		return $response;
	}

	/**
	 * Start playing.
	 *
	 * @return string|null server response string or NULL on error
	 */
	public function Play() {
		$this->DebugPrintCall("Play");

		if (!is_null($response = $this->SendCommand(MPD_CMD_PLAY))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("Play");
		return $response;
	}

	/**
	 * Skip directly to the song at <pos> in the MPD playlist.
	 *
	 * @param integer $pos playlist position of song to play
	 * @return string|null server response string or NULL on error
	 */
	public function SkipTo($pos) {
		$this->DebugPrintCall("SkipTo");

		if (!is_numeric($pos)) {
			$this->SetError("SkipTo(): argument 1 must be a numeric value.");
			return NULL;
		}

		if (!is_null($response = $this->SendCommand(MPD_CMD_PLAY, $pos))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("SkipTo");
		return $response;
	}

	/**
	 * If playing, skip to the previous song in the playlist.
	 *
	 * @return string|null server response string or NULL on error
	 */
	public function Previous() {
		$this->DebugPrintCall("Previous");

		if (!is_null($response = $this->SendCommand(MPD_CMD_PREV))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("Previous");
		return $response;
	}

	/**
	 * Seek directly to a given position within a track in the MPD playlist. The
	 * <pos> argument, given in seconds, is the track position to locate. The
	 * <track> argument, if supplied, is the track number in the playlist. If
	 * <track> is not specified, the current track is assumed.
	 *
	 * @param integer $pos track position in seconds to seek to
	 * @param integer $track playlist position of song to play (optional)
	 * @return string|null server response string or NULL on error
	 */
	public function SeekTo($pos, $track = -1) {
		$this->DebugPrintCall("SeekTo");

		if (!is_numeric($pos)) {
			$this->SetError("SeekTo(): argument 1 must be a numeric value.");
			return NULL;
		}

		if (!is_numeric($track)) {
			$this->SetError("SeekTo(): argument 2 must be a numeric value.");
			return NULL;
		}

		if ($track == -1) {
			$track = $this->currentTrackID;
		}

		if (!is_null($response = $this->SendCommand(MPD_CMD_SEEK, $track, $pos))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("SeekTo");
		return $response;
	}

	/**
	 * Stop playing.
	 *
	 * @return string|null server response string or NULL on error
	 */
	public function Stop() {
		$this->DebugPrintCall("Stop");

		if (!is_null($response = $this->SendCommand(MPD_CMD_STOP))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("Stop");
		return $response;
	}

	// ***************************************************************************
	// ************************** THE CURRENT PLAYLIST ***************************
	// ***************************************************************************

	/**
	 * Add the file <filename> to the end of the playlist. <filename> must be a
	 * track in the MPD database.
	 *
	 * @return string|null server response string or NULL on error
	 */
	public function PLAdd($filename) {
		$this->DebugPrintCall("PLAdd");

		// Add file to playlist and update class properties on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_PLADD,$filename))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("PLAdd");
		return $response;
	}

	/** PLAddBulk()
	 *
	 * Add each track listed in a single-dimensional <track_array>, which contains
	 * filenames of tracks to add, to the end of the playlist. This is used to add
	 * many, many tracks to the playlist in one swoop.
	 *
	 * @param array $track_array array of files to add to the playlist
	 * @return string|null server response string or NULL on error
	 */
	public function PLAddBulk($track_array) {
		$this->DebugPrintCall("PLAddBulk");
		$num_files = count($track_array);

		for ($i = 0; $i < $num_files; $i++) {
			$this->QueueCommand(MPD_CMD_PLADD, $track_array[$i]);
		}

		// Add files to playlist and update class properties on success.
		if (!is_null($response = $this->SendCommandQueue())) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("PLAddBulk");
		return $response;
	}

	/**
	 * Empty the playlist.
	 *
	 * @return string|null server response string or NULL on error
	 */
	public function PLClear() {
		$this->DebugPrintCall("PLClear");

		// Clear playlist and update class properties on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_PLCLEAR))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("PLClear");
		return $response;
	}

	/**
	 * Remove track at <pos> from the playlist.
	 *
	 * @param integer $pos playlist position of track to remove
	 * @return string|null server response string or NULL on error
	 */
	public function PLRemove($pos) {
		$this->DebugPrintCall("PLRemove");

		if (!is_numeric($pos)) {
			$this->SetError("PLRemove(): argument 1 must be a numeric value.");
			return NULL;
		}

		// Remove track from playlist and update class properties on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_PLREMOVE, $pos))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("PLRemove");
		return $response;
	}

	/**
	 * Moves track at <orig_pos> to position <new_pos> in the playlist. This is
	 * used to reorder the songs in the playlist.
	 *
	 * @param integer $orig_pos playlist position of track to move
	 * @param integer $new_pos destination playlist position
	 * @return string|null server response string or NULL on error
	 */
	public function PLMoveTrack($orig_pos, $new_pos) {
		$this->DebugPrintCall("PLMoveTrack");

		if (!is_numeric($orig_pos)) {
			$this->SetError("PLMoveTrack(): argument 1 must be numeric.");
			return NULL;
		}

		if (!is_numeric($new_pos)) {
			$this->SetError("PLMoveTrack(): argument 2 must be numeric.");
			return NULL;
		}

		// Check original positon is within the playlist range.
		if (($orig_pos < 0) || ($orig_pos > $this->playlistCount - 1)) {
			$this->SetError("PLMoveTrack(): argument 1 out of range.");
			return NULL;
		}

		// Check positions are different.
		if ($pos1 == $pos2) {
			$this->SetError("PLMoveTrack(): argument 1 and argument 2 must not be equal.");
			return NULL;
		}

		// Limit new position to the playlist range.
		if ($new_pos < 0) {
			$new_pos = 0;
		}

		if ($new_pos > ($this->playlistCount - 1)) {
			$new_pos = $this->playlistCount - 1;
		}

		// Move track and update class properties on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_PLMOVETRACK, $orig_pos, $new_pos))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("PLMoveTrack");
		return $response;
	}

	/**
	 * Randomly reorder the songs in the playlist.
	 *
	 * @return string|null server response string or NULL on error
	 */
	public function PLShuffle() {
		$this->DebugPrintCall("PLSuffle");

		if (!is_null($response = $this->SendCommand(MPD_CMD_PLSHUFFLE))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("PLShuffle");
		return $response;
	}

	/**
	 * Swap the positions of two songs in the playlist. This is used to reorder
	 * the songs in the playlist.
	 *
	 * @param integer $pos1 playlist position of first song for swapping
	 * @param integer $pos2 playlist position of second song for swapping
	 * @return string|null server response string or NULL on error
	 */
	public function PLSwapTracks($pos1, $pos2) {
		$this->DebugPrintCall("PLSwapTracks");

		if (!is_numeric($pos1)) {
			$this->SetError("PLSwapTracks(): argument 1 must be numeric.");
			return NULL;
		}

		if (!is_numeric($pos2)) {
			$this->SetError("PLSwapTracks(): argument 2 must be numeric.");
			return NULL;
		}

		// Check positons are within the playlist range.
		if (($pos1 < 0) || ($pos1 > ($this->playlistCount - 1))) {
			$this->SetError("PLSwapTracks(): argument 1 out of range.");
			return NULL;
		}

		if (($pos2 < 0) || ($pos2 > ($this->playlistCount - 1))) {
			$this->SetError("PLSwapTracks(): argument 2 out of range.");
			return NULL;
		}

		// Check positions are different.
		if ($pos1 == $pos2) {
			$this->SetError("PLSwapTracks(): argument 1 and argument 2 must not be equal.");
			return NULL;
		}

		// Swap tracks and update class properties on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_PLSWAPTRACKS, $pos1, $pos2))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("PLSwapTracks");
		return $response;
	}

	// ***************************************************************************
	// **************************** STORED PLAYLISTS *****************************
	// ***************************************************************************

	/**
	 * Retrieve a directory listing of the MPD playlist directory and place the
	 * results into a multidimensional array.
	 *
	 * @return array|null multidimensional array of playlists or NULL on error
	 */
	public function PLList() {
		$this->DebugPrintCall("PLList");
		$response = $this->SendCommand(MPD_CMD_PLLIST);
		$playlist_list = $this->ParseFileListResponse($response);
		$this->DebugPrintReturn("PLList");
		return $playlist_list["playlists"];
	}

	/**
	 * Load the playlist <filename>.m3u from the MPD playlist directory and append
	 * it to the current playlist.
	 *
	 * @param string $filename playlist filename
	 * @return string|null server response string or NULL on error
	 */
	public function PLLoad($filename) {
		$this->DebugPrintCall("PLLoad");

		// Load playlist file and update class properties on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_PLLOAD, $filename))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("PLLoad");
		return $response;
	}

	/**
	 * Delete the playlist <filename>.m3u from the MPD playlist directory.
	 *
	 * @param string $filename playlist filename
	 * @return string|null server response string or NULL on error
	 */
	public function PLDelete($filename) {
		$this->DebugPrintCall("PLDelete");
		$response = $this->SendCommand(MPD_CMD_PLDELETE, $filename);
		$this->DebugPrintReturn("PLDelete");
		return $response;
	}

	/**
	 * Save the current playlist to <filename>.m3u for later retrieval. The file
	 * is saved in the MPD playlist directory. Existing files will *not* be
	 * overwritten, instead the command will fail. You will have to remove the
	 * playlist file first using PLDelete().
	 *
	 * @param string $filename playlist filename
	 * @return string|null server response string or NULL on error
	 */
	public function PLSave($filename) {
		$this->DebugPrintCall("PLSave");
		$response = $this->SendCommand(MPD_CMD_PLSAVE, $filename);
		$this->DebugPrintReturn("PLSave");
		return $response;
	}

	// ***************************************************************************
	// *************************** THE MUSIC DATABASE ****************************
	// ***************************************************************************

	/**
	 * Look for exact matches in the MPD database. The find <type> should be one
	 * of the following:
	 *
	 * MPD_SEARCH_ARTIST, MPD_SEARCH_ALBUM, MPD_SEARCH_TITLE
	 *
	 * The find <string> is a case-sensitive locator string. Anything that
	 * exactly matches <string> will be returned in the results.
	 *
	 * @param string $type find type
	 * @param string $string what to find
	 * @param string $sort_mode sorting strategy (optional)
	 * @return array|null multidimensional array of files or NULL on error
	 */
	public function DBFind($type, $string, $sort_mode = MPD_SORT_DEFAULT) {
		$this->DebugPrintCall("DBFind");

		if (($type != MPD_SEARCH_ARTIST) && ($type != MPD_SEARCH_ALBUM) && ($type != MPD_SEARCH_TITLE)) {
			$this->SetError("DBFind(): invalid find type.");
			return NULL;
		} else {
			if (is_null($response = $this->SendCommand(MPD_CMD_FIND, $type, $string))) {
				return NULL;
			}

			$tmp_array = $this->ParseFileListResponse($response, $sort_mode);
			$find_list = $tmp_array["files"];
		}

		if ($this->debugging) {
			echo "find_list:\n";
			echo print_r($find_list) . "\n";
		}

		$this->DebugPrintReturn("DBFind");
		return $find_list;
	}

	/**
	 * Return sorted array of artists in the MPD database.
	 *
	 * @return array|null single dimensional array of artists or NULL on error
	 */
	public function DBGetArtists() {
		$this->DebugPrintCall("DBGetArtists");

		if (is_null($response = $this->SendCommand(MPD_CMD_TABLE, MPD_TBL_ARTIST))) {
			return NULL;
		}

		$artist_array = array();
		$line = strtok($response, "\n");
		$name = "";
		$counter = -1;

		while ($line) {
			list($element, $value) = explode(": ", $line, 2);

			if ($element == "Artist") {
				$counter++;
				$name = $value;
				$artist_array[$counter] = $name;
			}

			$line = strtok("\n");
		}

		natcasesort($artist_array);
		$this->DebugPrintReturn("DBGetArtists");
		return $artist_array;
	}

	/**
	 * Return a sorted array of albums in the MPD database. Optional parameter is
	 * an artist name which will list all albums by a particular artist.
	 *
	 * @param string $artist artist name (optional)
	 * @return array|null single dimensional array of albums or NULL on error
	 */
	public function DBGetAlbums($artist = NULL) {
		$this->DebugPrintCall("DBGetAlbums");

		if (is_null($response = $this->SendCommand(MPD_CMD_TABLE, MPD_TBL_ALBUM, $artist))) {
			return NULL;
		}

		$album_array = array();
		$line = strtok($response, "\n");
		$name = "";
		$counter = -1;

		while ($line) {
			list($element, $value) = explode(": ", $line, 2);

			if ($element == "Album") {
				$counter++;
				$name = $value;
				$album_array[$counter] = $name;
			}

			$line = strtok("\n");
		}

		natcasesort($album_array);
		$this->DebugPrintReturn("DBGetAlbums");
		return $album_array;
	}

	/**
	 * Retrieve a database directory listing of <directory> and place the results
	 * into a multidimensional array. If no directory is specified, the directory
	 * listing is at the base of the MPD music path.
	 *
	 * @param string $directory directory name relative to the MPD database root (optional)
	 * @return array|null multidimensional array of directories and files or NULL on error
	 */
	public function DBGetDir($directory = "") {
		$this->DebugPrintCall("DBGetDir");
		$response = $this->SendCommand(MPD_CMD_LSDIR, $directory);
		$tmp_array = $this->ParseFileListResponse($response);
		$directory_content = array("directories" => $tmp_array["directories"], "files" => $tmp_array["files"]);
		$this->DebugPrintReturn("DBGetDir");
		return $directory_content;
	}

	/**
	 * Searches the MPD database. The find <type> should be one of the following:
	 *
	 * MPD_SEARCH_ARTIST, MPD_SEARCH_ALBUM, MPD_SEARCH_TITLE
	 *
	 * The find <string> is a case-insensitive locator string. Anything that
	 * contains <string> will be returned in the results.
	 *
	 * @param string $type search type
	 * @param string $string what to search
	 * @param string $sort_mode sorting strategy (optional)
	 * @return array|null array of files or NULL on error
	 */
	public function DBSearch($type, $string, $sort_mode = MPD_SORT_DEFAULT) {
		$this->DebugPrintCall("DBSearch");

		if (($type != MPD_SEARCH_ARTIST) && ($type != MPD_SEARCH_ALBUM) && ($type != MPD_SEARCH_TITLE)) {
			$this->SetError("DBSearch(): invalid find type.");
			return NULL;
		} else {
			if (is_null($response = $this->SendCommand(MPD_CMD_SEARCH, $type, $string))) {
				return NULL;
			}

			$tmp_array = $this->ParseFileListResponse($response, $sort_mode);
			$search_list = $tmp_array["files"];
		}

		if ($this->debugging) {
			echo "search_list:\n";
			echo print_r($search_list) . "\n";
		}

		$this->DebugPrintReturn("DBSearch");
		return $search_list;
	}

	/**
	 * Tell MPD to scan the music directory for new tracks and to refresh the
	 * database. Tracks cannot be played unless they are in the MPD database.
	 *
	 * @return string|null server response string or NULL on error
	 */
	public function DBRefresh() {
		$this->DebugPrintCall("DBRefresh");

		// Trigger database update and update class properties on success.
		if (!is_null($response = $this->SendCommand(MPD_CMD_REFRESH))) {
			$this->RefreshInfo();
		}

		$this->DebugPrintReturn("DBRefresh");
		return $response;
	}

	/**
	 * Return a multidimensional array of all sampler ("Various Artists")
	 * albums. A sampler is an album that has tracks with the <sampler_tag>
	 * (defaults to "AlbumArtist") set to <sampler_tag_content> (defaults to
	 * "Various Artists").
	 *
	 * NOTE: This function is SLOW. You should cache the result array somehow and
	 * only rebuild it when you refresh the MPD database.
	 *
	 * @param string $sampler_tag name of sampler tag (optional)
	 * @param string $sampler_tag_content sampler tag content to look for (optional)
	 * @return array|null multidimensional array of sampler albums or NULL on error
	 */
	public function DBGetSamplers($sampler_tag = "AlbumArtist", $sampler_tag_content = "Various Artists") {
		$this->DebugPrintCall("DBGetSamplers");
		//$start = microtime(true);

		if (is_null($response = $this->SendCommand(MPD_CMD_FIND, $sampler_tag, $sampler_tag_content))) {
			return NULL;
		}

		$tmp_array = $this->ParseFileListResponse($response);
		$find_list = $tmp_array["files"];
		$sampler_array = array();

		foreach ($find_list as $file) {
			if (isset($file[$sampler_tag])) {
				if ($file[$sampler_tag] == $sampler_tag_content) {
					$sampler = array("Album" => $file["Album"], "Date" => $file["Date"]);

					if (!in_array($sampler, $sampler_array)) {
						$sampler_array[] = $sampler;
					}
				}
			}
		}

		//$end = microtime(true);
		//$diff = $end - $start;
		//echo "{$diff}s\n";
		$this->DebugPrintReturn("DBGetSamplers");
		return $sampler_array;
	}

	/**
	 * Return a sorted array of artists that do *only* appear on sampler albums.
	 * See DBGetSamplers(), this function takes the same parameters.
	 *
	 * This can be used if your application handles "Various Artists" albums in
	 * some separate way. Imagine you have 10 punk samplers, each containing 30
	 * tracks by different bands. Maybe you do not want to flood the "normal"
	 * artist list with hundreds of bands that have exactly one song in your
	 * collection.
	 *
	 * NOTE: This function is S.L.O.W. (!!). You *must* cache the result array
	 * somehow and only rebuild it when you refresh the MPD database.
	 *
	 * @param string $sampler_tag name of sampler tag (optional)
	 * @param string $sampler_tag_content sampler tag content to look for (optional)
	 * @return array|null single dimensional array of sampler only artists or NULL on error
	 * @see DBGetSamplers()
	 */
	public function DBGetSamplerOnlyArtists($sampler_tag = "AlbumArtist", $sampler_tag_content = "Various Artists") {
		$this->DebugPrintCall("DBGetSamplerOnlyArtists");
		//$start = microtime(true);
		$artist_array = $this->DBGetArtists();
		$sampler_array_tmp = $this->DBGetSamplers($sampler_tag, $sampler_tag_content);

		if (is_null($artist_array) || is_null($sampler_array_tmp)) {
			return NULL;
		}

		$sampler_array = array();
		$soa_array = array();

		// Create a single dimensional array of sampler album titles from the
		// multidimensional sampler array.
		foreach ($sampler_array_tmp as $sampler) {
			$sampler_array[] = $sampler["Album"];
		}

		// Loop through all artists, get the albums for each artist and check if
		// those albums are all samplers.
		foreach ($artist_array as $artist) {
			$album_array = $this->DBGetAlbums($artist);
			$sampler_only = TRUE;

			foreach ($album_array as $album) {
				if (!in_array($album, $sampler_array)) {
					$sampler_only = FALSE;
					break;
				}
			}

			if ($sampler_only) {
				$soa_array[] = $artist;
			}
		}

		natcasesort($soa_array);
		//$end = microtime(true);
		//$diff = $end - $start;
		//echo "{$diff}s\n";
		$this->DebugPrintReturn("DBGetSamplerOnlyArtists");
		return $soa_array;
	}

	// ***************************************************************************
	// *************************** CONNECTION SETTINGS ***************************
	// ***************************************************************************

	/**
	 * Connect to the MPD server.
	 *
	 * NOTE: This function is automatically called by the constructor. There
	 * should normally be no reason to call it manually, and it may become private
	 * soon.
	 *
	 * @deprecated 0.1b1
	 * @return string|null server response string or NULL on error
	 */
	public function Connect() {
		$this->DebugPrintCall("Connect");
		$this->DebugPrintMessage("host: " . $this->host . ", port: " . $this->port);
		$error_number = 0;
		$error_str = "";
		$this->mpdSocket = fsockopen($this->host, $this->port, $error_number, $error_str, 10);

		if (!$this->mpdSocket) {
			$this->SetError("Connection failed, socket error: '" . $error_str . "' (" . $error_number . ").");
			return NULL;
		} else {
			while (!feof($this->mpdSocket)) {
				$response =	fgets($this->mpdSocket, 1024);

				if (strncmp(MPD_RESPONSE_OK, $response, strlen(MPD_RESPONSE_OK)) == 0) {
					$this->connected = TRUE;
					$this->DebugPrintReturn("Connect");
					return $response;
				}

				if (strncmp(MPD_RESPONSE_ERR, $response, strlen(MPD_RESPONSE_ERR)) == 0) {
					$this->SetError("Connection failed, server responded with: '" . $response . "'.");
					return NULL;
				}
			}

			// Generic failure.
			$this->SetError("Connection failed.");
			return NULL;
		}
	}

	/**
	 * Shut down the MPD server (send the "kill" command). This closes the current
	 * connection and prevents future communication with the server.
	 *
	 * @return string|null server response string or NULL on error
	 */
	public function Shutdown() {
		$this->DebugPrintCall("Shutdown");

		if (is_null($response = $this->SendCommand(MPD_CMD_SHUTDOWN))) {
			$this->SetError("Shutdown command returned an error. Will close socket anyway.");
		}

		// In any case, close the socket and reset connection state variables.
		fclose($this->mpdSocket);
		$this->connected = FALSE;
		$this->mpdProtocolVersion = "0.0.0";
		unset($this->mpdSocket);

		$this->DebugPrintReturn("Shutdown");
		return $response;
	}

	/**
	 * Close the connection to the MPD server.
	 *
	 * NOTE: This function is automatically called by the destructor. There should
	 * normally be no reason to call it manually, and it may become private soon.
	 *
	 * @deprecated 0.1b1
	 * @return string|null server response string or NULL on error
	 */
	public function Disconnect() {
		$this->DebugPrintCall("Disconnect");

		if (is_null($response = $this->SendCommand(MPD_CMD_CLOSE))) {
			$this->SetError("Disconnect command returned an error. Will close socket anyway.");
		}

		// In any case, close the socket and reset connection state variables.
		fclose($this->mpdSocket);
		$this->connected = FALSE;
		$this->mpdProtocolVersion = "0.0.0";
		unset($this->mpdSocket);

		$this->DebugPrintReturn("Disconnect");
		return $response;
	}

	// ***************************************************************************
	// **************************** INTERNAL FUNCTIONS ***************************
	// ***************************************************************************

	/**
	 * Check MPD command compatibility against our internal tables. If there is no
	 * version listed, allow it by default.
	 *
	 * @param string $cmd the defined MPD command constant to check
	 * @return boolean TRUE if compatible, FALSE if not
	 */
	private function CheckCompatibility($cmd) {
		$mpd_ver = $this->ComputeVersionValue($this->mpdProtocolVersion);
		$req_ver_low = NULL;
		$req_ver_high = NULL;

		// Check minimum compatibility.
		if (isset($this->COMPATIBILITY_MIN_TBL[$cmd])) {
			$req_ver_low = $this->COMPATIBILITY_MIN_TBL[$cmd];
		}

		if ($req_ver_low) {
			$req_ver = $this->ComputeVersionValue($req_ver_low);

			if ($mpd_ver < $req_ver) {
				$this->SetError("Command '" . $cmd . "' is not compatible with this version of MPD, version " . $req_ver_low . " required.");
				return FALSE;
			}
		}

		// Check maximum compatibility. This will check for deprecations.
		if (isset($this->COMPATIBILITY_MAX_TBL[$cmd])) {
			$req_ver_high = $this->COMPATIBILITY_MAX_TBL[$cmd];
		}

		if ($req_ver_high) {
			$req_ver = $this->ComputeVersionValue($req_ver_high);

			if ($mpd_ver > $req_ver) {
				$this->SetError("Command '" . $cmd . "' has been deprecated in this version of MPD.");
				return FALSE;
			}
		}

		return TRUE;
	}

	/**
	 * Compute a compatibility value from a version string.
	 *
	 * @param string $version_str MPD protocol version, e.g. "0.15.0"
	 * @return integer MPD protocol version as an integer, e.g. 150
	 */
	private function ComputeVersionValue($version_str) {
		list ($ver_maj, $ver_min, $ver_rel) = explode(".", $version_str);
		$version_value = (100 * $ver_maj) + (10 * $ver_min) + ($ver_rel);
		return $version_value;
	}

	/**
	 * Print debug output on function call.
	 *
	 * @param string $function_name the name of the function called
	 */
	private function DebugPrintCall($function_name) {
		if ($this->debugging) {
			echo $function_name . "()\n";
		}
	}

	/**
	 * Print debug output when queueing a command or sending a command to the MPD
	 * server.
	 *
	 * @param string $command_str MPD command string
	 * @param string $arg1 first argument (optional)
	 * @param string $arg2 second argument (optional)
	 * @see QueueCommand()
	 * @see SendCommand()
	 */
	private function DebugPrintCommand($command_str, $arg1 = "", $arg2 = "") {
		if ($this->debugging) {
			echo "command: '" . $command_str . "', arg1: '" . $arg1 . "' arg2: '" . $arg2 . "'\n";
		}
	}

	/**
	 * Print debug output on error.
	 *
	 * @param string $error_str the error string (same as $this->lastError)
	 * @see SetError()
	 */
	private function DebugPrintError($error_str) {
		if ($this->debugging) {
			echo "ERROR: " . $error_str . "\n";
		}
	}

	/**
	 * Print generic debug output.
	 *
	 * @param string $msg the generic debug message
	 */
	private function DebugPrintMessage($msg) {
		if ($this->debugging) {
			echo $msg . "\n";
		}
	}

	/**
	 * Print debug output on function return.
	 *
	 * @param string $function_name the name of the function returning
	 */
	private function DebugPrintReturn($function_name) {
		if ($this->debugging) {
			echo $function_name . "() / return\n";
		}
	}

	/**
	 * usort() callback function for comparing and sorting directories.
	 *
	 * @param array $a associative directory array
	 * @param array $b associative directory array
	 * @return integer result of comparision
	 */
	private function DirectorySort($a, $b) {
		return strnatcasecmp($a["directory"], $b["directory"]);
	}

	/**
	 * usort() callback function for comparing and sorting files depending on
	 * present tags.
	 *
	 * @param array $a associative file array
	 * @param array $b associative file array
	 * @return integer result of comparision
	 */
	private function FileSort($a, $b) {
		// Default sorting strategy:
		//
		// If files <a> and <b> have the "Artist" tag set and it is not equal: sort
		// the files based on the "Artist" tag. If not: continue.
		//
		// If files <a> and <b> have the "Date" tag set and it is not equal, sort
		// the files based on the "Date" tag. If not: continue.
		//
		// ...
		//
		// Last resort: sort files <a> and <b> based on their names.
		$sort_tags = array("Artist", "Date", "Album", "Track", "Title");

		foreach ($sort_tags as $sort_tag) {
			if (isset($a[$sort_tag]) && isset($b[$sort_tag])) {
				if ($a[$sort_tag] != $b[$sort_tag]) {
					return strnatcasecmp($a[$sort_tag], $b[$sort_tag]);
				}
			}
		}

		return strnatcasecmp($a["file"], $b["file"]);
	}

	/**
	 * usort() callback function for comparing and sorting files depending on
	 * present tags.
	 *
	 * @param array $a associative file array
	 * @param array $b associative file array
	 * @return integer result of comparision
	 * @see FileSort()
	 */
	private function FileSort_Samplers($a, $b) {
		// Sampler sorting strategy: prefer "Track" over "Artist".
		$sort_tags = array("Date", "Album", "Track", "Artist", "Title");

		foreach ($sort_tags as $sort_tag) {
			if (isset($a[$sort_tag]) && isset($b[$sort_tag])) {
				if ($a[$sort_tag] != $b[$sort_tag]) {
					return strnatcasecmp($a[$sort_tag], $b[$sort_tag]);
				}
			}
		}

		return strnatcasecmp($a["file"], $b["file"]);
	}

	/**
	 * Take the response of an MPD command that returns a string encoded list of
	 * files and build a multidimensional array of it. Fields are separated by
	 * "\n". A response string might look like this:
	 *
	 * "playlist: Late night mix\n
	 *  Last-Modified: 2012-01-28T21:47:11Z\n
	 *  playlist: Punk only\n
	 *  Last-Modified: 2012-01-28T22:08:15Z\n
	 *  ..."
	 *
	 * There are three elements that can start a new record: "file", "directory"
	 * and "playlist". Additionally, a response string can contain a mixture (!)
	 * of these three element types.
	 *
	 * This leads to a multidimensional result array:
	 *
	 * $result_array["directories"] containing associative arrays of extracted
	 *   directories,
	 * $result_array["files"] containing associative arrays of extracted files and
	 * $result_array["playlists"] containing associative arrays of extracted
	 *   playlists.
	 *
	 * By default, the function will sort the result arrays. Use the optional
	 * parameter to disable this behaviour (e.g. when parsing the current
	 * playlist.)
	 *
	 * NOTE: This function is used internally within the class. It should *not* be
	 * used externally and may become private soon.
	 *
	 * @deprecated 0.1b1
	 * @param string $response response of an MPD command that returns a file list
	 * @param string $sort_mode sorting strategy (optional)
	 * @return array|null multidimensional array or NULL
	 */
	public function ParseFileListResponse($response, $sort_mode = MPD_SORT_DEFAULT) {
		if (is_null($response)) {
			return NULL;
		} else {
			$directories = array();
			$files = array();
			$playlists = array();
			$directory_counter = -1;
			$file_counter = -1;
			$playlist_counter = -1;
			$current_element = "";
			$line = strtok($response, "\n");

			// Extract elements of different type from the response string and put
			// them in the correct destination arrays.
			while ($line) {
				list($element, $value) = explode(": ", $line, 2);

				if ($element == "directory") {
					$current_element = $element;
					$directory_counter++;
				}

				if ($element == "file") {
					$current_element = $element;
					$file_counter++;
				}

				if ($element == "playlist") {
					$current_element = $element;
					$playlist_counter++;
				}

				switch ($current_element) {
					case "directory":
						$directories[$directory_counter][$element] = $value;
						break;
					case "file":
						$files[$file_counter][$element] = $value;
						break;
					case "playlist":
						$playlists[$playlist_counter][$element] = $value;
						break;
				}

				$line = strtok("\n");
			}
		}

		// Sort the three arrays.
		switch ($sort_mode) {
			case MPD_SORT_DEFAULT:
				usort($directories, array($this, "DirectorySort"));
				usort($files, array($this, "FileSort"));
				usort($playlists, array($this, "PlaylistSort"));
				break;
			case MPD_SORT_SAMPLERS:
				usort($directories, array($this, "DirectorySort"));
				usort($files, array($this, "FileSort_Samplers"));
				usort($playlists, array($this, "PlaylistSort"));
				break;
			case MPD_SORT_UNSORTED:
				// Nothing to do.
				break;
			}

		// Build one big result array.
		$result_array = array("directories" => $directories, "files" => $files, "playlists" => $playlists);
		return $result_array;
	}

	/**
	 * usort() callback function for comparing and sorting playlist files.
	 *
	 * @param array $a associative playlist file array
	 * @param array $b associative playlist file array
	 * @return integer result of comparision
	 */
	private function PlaylistSort($a, $b) {
		return strnatcasecmp($a["playlist"], $b["playlist"]);
	}

	/**
	 * Update all class properties with the values from the MPD server. This
	 * function is automatically called upon Connect().
	 *
	 * NOTE: This function is used internally within the class. It should *not* be
	 * used externally and may become private soon.
	 *
	 * @deprecated 0.1b1
	 * @return bool|null TRUE if successful or NULL
	 */
	public function RefreshInfo() {
		// Get the server status.
		$status_str = $this->SendCommand(MPD_CMD_STATUS);

		if (!$status_str) {
			return NULL;
		} else {
			$status = array();
			$status_line = strtok($status_str, "\n");

			while ($status_line) {
				list ($element, $value) = explode(": ", $status_line, 2);
				$status[$element] = $value;
				$status_line = strtok("\n");
			}
		}

		// Get the server statistics.
		$stats_str = $this->SendCommand(MPD_CMD_STATISTICS);

		if (!$stats_str) {
			return NULL;
		} else {
			$stats = array();
			$stats_line = strtok($stats_str, "\n");

			while ($stats_line) {
				list ($element, $value) = explode(": ", $stats_line, 2);
				$stats[$element] = $value;
				$stats_line = strtok("\n");
			}
		}

		// Get the current playlist, parse it and set properties.
		$playlist_str = $this->SendCommand(MPD_CMD_PLINFO);

		if (!$playlist_str) {
			$this->playlist = array();
			$this->playlistCount = 0;
		} else {
			// Do *not* sort, we want the real playlist order.
			$tmp_array = $this->ParseFileListResponse($playlist_str, MPD_SORT_UNSORTED);
			$this->playlist = $tmp_array["files"];
			$this->playlistCount = count($this->playlist);
		}

		// Set status properties.
		$this->volume = $status["volume"];
		$this->repeat = $status["repeat"];
		$this->random = $status["random"];
		$this->single = $status["single"];
		$this->consume = $status["consume"];
		$this->state = $status["state"];
		$this->crossfade = $status["xfade"];

		if (($this->state == MPD_STATE_PLAYING) || ($this->state == MPD_STATE_PAUSED)) {
			$this->currentTrackID = $status["song"];
			list ($this->currentTrackPosition, $this->currentTrackLength) = explode(":", $status["time"]);
		} else {
			$this->currentTrackID = -1;
			$this->currentTrackPosition = -1;
			$this->currentTrackLength = -1;
		}

		if (isset($status["bitrate"])) {
			$this->bitrate = $status["bitrate"];
		} else {
			$this->bitrate = 0;
		}

		// Set statistics properties.
		$this->numArtists = $stats["artists"];
		$this->numAlbums = $stats["albums"];
		$this->numSongs = $stats["songs"];
		$this->uptime = $stats["uptime"];
		$this->playtime = $stats["playtime"];
		$this->dbPlaytime = $stats["db_playtime"];
		$this->dbLastRefreshed = $stats["db_update"];
		return TRUE;
	}

	/**
	 * Queue a generic command for later sending to the MPD server. The command
	 * queue can hold as many commands as needed, They are sent all at once, in
	 * the order they are queued, using the SendCommandQueue() method. The syntax
	 * for queueing commands is identical to SendCommand().
	 *
	 * NOTE: This function is used internally within the class. It should *not* be
	 * used externally and may become private soon.
	 *
	 * @deprecated 0.1b1
	 * @param string $command_str MPD command string
	 * @param string $arg1 first argument (optional)
	 * @param string $arg2 second argument (optional)
	 * @return bool|null TRUE if successful or NULL
	 * @see SendCommand()
	 */
	public function QueueCommand($command_str, $arg1 = "", $arg2 = "") {
		$this->DebugPrintCall("QueueCommand");
		$this->DebugPrintCommand($command_str, $arg1, $arg2);

		if (!$this->connected) {
			$this->SetError("Cannot queue command. Not connected.");
			return NULL;
		} else {
			if (strlen($this->commandQueue) == 0) {
				$this->commandQueue = MPD_CMD_START_BULK . "\n";
			}

			if (strlen($arg1) > 0) {
				$command_str .= " \"" . $arg1 . "\"";
			}

			if (strlen($arg2) > 0) {
				$command_str .= " \"" . $arg2 . "\"";
			}

			$this->commandQueue .= $command_str . "\n";
		}

		$this->DebugPrintReturn("QueueCommand");
		return TRUE;
	}

	/**
	 * Send a generic command to the MPD server. Several command constants are
	 * predefined for use (see MPD_CMD_* constant definitions above).
	 *
	 * NOTE: This function is used internally within the class. It should *not* be
	 * used externally and may become private soon.
	 *
	 * @deprecated 0.1b1
	 * @param string $command_str MPD command string
	 * @param string $arg1 first argument (optional)
	 * @param string $arg2 second argument (optional)
	 * @return string|null server response string or NULL on error
	 */
	public function SendCommand($command_str, $arg1 = "", $arg2 = "") {
		$this->DebugPrintCall("SendCommand");
		$this->DebugPrintCommand($command_str, $arg1, $arg2);

		if (!$this->connected) {
			$this->SetError("Cannot send command. Not connected.");
			return NULL;
		} else {
			// Check the command compatibility.
			if (!$this->CheckCompatibility($command_str)) {
				return NULL;
			}

			if (strlen($arg1) > 0) {
				$command_str .= " \"" . $arg1 . "\"";
			}

			if (strlen($arg2) > 0) {
				$command_str .= " \"" . $arg2 . "\"";
			}

			// Clear the error string and send the command to the MPD server.
			$this->lastError = "";
			fputs($this->mpdSocket, $command_str . "\n");

			// Get the server answer and build the response string.
			$response = "";

			while (!feof($this->mpdSocket)) {
				$line = fgets($this->mpdSocket, 1024);

				// An OK signals the end of the transmission. We will ignore it.
				if (strncmp(MPD_RESPONSE_OK, $line, strlen(MPD_RESPONSE_OK)) == 0) {
					break;
				}

				// An ERR signals the end of the transmission with an error. Get the
				// error message.
				if (strncmp(MPD_RESPONSE_ERR, $line, strlen(MPD_RESPONSE_ERR)) == 0) {
					$junk = "";
					$error_tmp = "";
					list($junk, $error_tmp) = explode(MPD_RESPONSE_ERR . " ", $line);
					$this->SetError(strtok($error_tmp, "\n"));
					return NULL;
				}

				// Build the response string.
				$response .= $line;
			}

			$this->DebugPrintMessage("response: '" . $response . "'");
		}

		$this->DebugPrintReturn("SendCommand");
		return $response;
	}

	/**
	 * Send all commands in the command queue to the MPD server.
	 *
	 * NOTE: This function is used internally within the class. It should *not* be
	 * used externally and may become private soon.
	 *
	 * @deprecated 0.1b1
	 * @return string|null server response string or NULL on error
	 * @see QueueCommand()
	 */
	public function SendCommandQueue() {
		$this->DebugPrintCall("SendCommandQueue");

		if (!$this->connected) {
			$this->SetError("Cannot send command queue. Not connected.");
			return NULL;
		} else {
			$this->commandQueue .= MPD_CMD_END_BULK . "\n";
		}


		if (is_null($response = $this->SendCommand($this->commandQueue))) {
			return NULL;
		} else {
			$this->commandQueue = "";
		}

		$this->DebugPrintReturn("SendCommandQueue");
		return $response;
	}

	/**
	 * Set error string.
	 *
	 * @param string $error_str the error message to set
	 */
	private function SetError($error_str) {
		$this->DebugPrintError($error_str);
		$this->lastError = $error_str;
	}
}
?>
